import { HttpClient } from '@actions/http-client';
import { OS, Arch } from './os_arch';
import { sortVersions, compareVersions } from './utils';
import { CUDA_LINKS, START_SUPPORTED_CUDA_VERSION, OLD_CUDA_VERSIONS } from './const';

/**
 * Get the URL for the download file for a given CUDA version
 * @param version - CUDA version string (e.g., "12.3.0")
 * @param dir - The directory containing the download file
 * @param filename - The name of the download file
 * @returns The URL for the download file
 */
export function getDownloadUrl(version: string, dir: string, filename: string): string {
  return `https://developer.download.nvidia.com/compute/cuda/${version}/${dir}/${filename}`;
}

/**
 * Get the URL for the MD5 checksum file for a given CUDA version
 * @param version - CUDA version string (e.g., "12.3.0")
 * @returns The URL for the MD5 checksum file
 */
export function getMd5sumUrl(version: string): string {
  const major_version: number = parseInt(version.split('.')[0]);
  if (major_version >= 11) {
    return `https://developer.download.nvidia.com/compute/cuda/${version}/docs/sidebar/md5sum.txt`;
  } else {
    return CUDA_LINKS[version].md5sumUrl;
  }
}

/**
 * Fetch and parse MD5 checksum data for a given CUDA version
 * @param version - CUDA version string (e.g., "12.3.0")
 * @returns Promise that resolves to the MD5 checksum text content
 * @throws Error if the download fails or the response is not ok
 */
export async function fetchMd5sum(version: string): Promise<Record<string, string>> {
  const client = new HttpClient('setup-cuda');
  const url = getMd5sumUrl(version);

  const response = await client.get(url);

  if (response.message.statusCode !== 200) {
    throw new Error(
      `Failed to fetch MD5 checksum from ${url}. Please check the version and try again: ${response.message.statusCode} ${response.message.statusMessage}`
    );
  }

  const text = await response.readBody();

  const md5sums: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const [md5sum, filename] = line.split(' ');
    md5sums[filename] = md5sum;
  }
  return md5sums;
}

/**
 * Normalize CUDA version for old
 * For major version <= 10, returns only major.minor (e.g., "8.0", "10.2")
 * For major version >= 11, returns the full version (e.g., "11.0.3", "12.3.0")
 * @param version - Version string to normalize
 * @returns Normalized version string
 */
export function normalizeCudaVersion(version: string): string {
  const parts = version.split('.');
  const major = parseInt(parts[0], 10);

  if (isNaN(major)) {
    return version;
  }

  if (major <= 10) {
    // For CUDA 10 and below, only major.minor is available in opensource directory
    return parts.slice(0, 2).join('.');
  }

  // For CUDA 11 and above, full version is available
  return version;
}

/**
 * Fetch available CUDA versions from redistrib JSON manifests (Method A)
 * @returns Promise that resolves to an array of version strings
 */
export async function fetchRedistribVersions(): Promise<string[]> {
  const client = new HttpClient('setup-cuda');
  const url = 'https://developer.download.nvidia.com/compute/cuda/redist/';

  const response = await client.get(url);

  if (response.message.statusCode !== 200) {
    throw new Error(
      `Failed to fetch redistrib index from ${url}: ${response.message.statusCode} ${response.message.statusMessage}`
    );
  }

  const html = await response.readBody();

  // Extract redistrib_*.json filenames
  const redistribPattern = /redistrib_([0-9]+\.[0-9]+(?:\.[0-9]+)?(?:\.[0-9]+)?)\.json/g;
  const versions = new Set<string>();

  let match;
  while ((match = redistribPattern.exec(html)) !== null) {
    versions.add(match[1]);
  }

  return sortVersions([...versions]);
}

/**
 * Fetch available CUDA versions from CUDA Toolkit Archive page (Method B)
 * @returns Promise that resolves to an array of version strings
 */
export async function fetchArchiveVersions(): Promise<string[]> {
  const client = new HttpClient('setup-cuda');
  const url = 'https://developer.nvidia.com/cuda-toolkit-archive';

  const response = await client.get(url);

  if (response.message.statusCode !== 200) {
    throw new Error(
      `Failed to fetch archive page from ${url}: ${response.message.statusCode} ${response.message.statusMessage}`
    );
  }

  const html = await response.readBody();

  const versions = new Set<string>();

  // Pattern 1: "CUDA Toolkit X.Y.Z" or "CUDA Toolkit X.Y"
  const pattern1 = /CUDA Toolkit\s+(\d+\.\d+(?:\.\d+)?)/gi;
  let match;
  while ((match = pattern1.exec(html)) !== null) {
    versions.add(match[1]);
  }

  // Pattern 2: Links with version numbers in href
  const pattern2 = /cuda-(\d+)-(\d+)(?:-(\d+))?-/g;
  while ((match = pattern2.exec(html)) !== null) {
    const version = match[3] ? `${match[1]}.${match[2]}.${match[3]}` : `${match[1]}.${match[2]}`;
    versions.add(version);
  }

  return sortVersions([...versions]);
}

/**
 * Fetch available CUDA versions from opensource directory (Method C)
 * Note: For CUDA 10 and below, only major.minor versions are available (e.g., "8.0", "10.2")
 * For CUDA 11 and above, full versions are available (e.g., "11.0.3", "12.3.0")
 * @returns Promise that resolves to an array of version strings
 */
export async function fetchOpensourceVersions(): Promise<string[]> {
  const client = new HttpClient('setup-cuda');
  const url = 'https://developer.download.nvidia.com/compute/cuda/opensource/';

  const response = await client.get(url);

  if (response.message.statusCode !== 200) {
    throw new Error(
      `Failed to fetch opensource index from ${url}: ${response.message.statusCode} ${response.message.statusMessage}`
    );
  }

  const html = await response.readBody();

  // Extract version directory names
  const versionPattern = />([0-9]+\.[0-9]+(?:\.[0-9]+)?)\//g;
  const versions = new Set<string>();

  let match;
  while ((match = versionPattern.exec(html)) !== null) {
    const normalizedVersion = normalizeCudaVersion(match[1]);
    versions.add(normalizedVersion);
  }

  return sortVersions([...versions]);
}

/**
 * Fetch all available CUDA versions by combining Method A, B, and C
 * @returns Promise that resolves to an array of unique version strings, sorted
 */
export async function fetchAvailableCudaVersions(): Promise<string[]> {
  const [redistribVersions, archiveVersions, opensourceVersions] = await Promise.all([
    fetchRedistribVersions(),
    fetchArchiveVersions(),
    fetchOpensourceVersions(),
  ]);

  // Combine and deduplicate versions
  const allVersions = new Set([
    ...redistribVersions,
    ...archiveVersions,
    ...opensourceVersions,
    ...OLD_CUDA_VERSIONS,
  ]);

  let versions = sortVersions([...allVersions]);

  // Filter versions to only include START_SUPPORTED_CUDA_VERSION and later
  versions = versions.filter(
    (version) => compareVersions(version, START_SUPPORTED_CUDA_VERSION) >= 0
  );

  return versions;
}

/**
 * Find a matching CUDA version from the available versions list
 * @param inputVersion - Version string to match (e.g., "latest", "11", "11.2", "11.2.0")
 * @returns Promise that resolves to matched version string, or undefined if not found
 *
 * @example
 * await findCudaVersion('latest') // Returns the latest available version
 * await findCudaVersion('10') // Returns the latest 10.x version
 * await findCudaVersion('11.0') // Returns the latest 11.0.x version
 * await findCudaVersion('11.0.1') // Returns '11.0.1' if available
 */
export async function findCudaVersion(inputVersion: string): Promise<string | undefined> {
  // Fetch available versions
  const versions = await fetchAvailableCudaVersions();

  // Case 1: "latest" returns the newest version
  if (inputVersion === 'latest') {
    return versions[versions.length - 1];
  }

  // Case 2: Exact match
  if (versions.includes(inputVersion)) {
    return inputVersion;
  }

  // Case 3: Prefix match (e.g., "10" matches "10.x", "11.2" matches "11.2.x")
  // Find all versions that start with the input followed by a dot
  const prefix = inputVersion + '.';
  const matchingVersions = versions.filter((v) => v.startsWith(prefix));
  if (matchingVersions.length > 0) {
    // Return the latest matching version
    return matchingVersions[matchingVersions.length - 1];
  }

  // Case 4: No match found
  return undefined;
}

/**
 * Get the URL for the CUDA installer for a given version, OS, and architecture
 * @param version - CUDA version string (e.g., "12.3.0")
 * @param os - Operating system (e.g., OS.LINUX, OS.WINDOWS)
 * @param arch - Architecture (e.g., Arch.X86_64, Arch.ARM64_SBSA)
 * @returns The URL for the CUDA installer
 */
export async function getCudaInstallerUrl(version: string, os: OS, arch: Arch): Promise<string> {
  // Check if the version is supported
  if (compareVersions(version, START_SUPPORTED_CUDA_VERSION) < 0) {
    throw new Error(`CUDA version ${version} is not supported`);
  }
  const majorVersion = parseInt(version.split('.')[0]);
  if (majorVersion <= 10 && os === OS.LINUX && arch === Arch.ARM64_SBSA) {
    throw new Error(
      `CUDA version ${version} is not supported on Linux with Arm architecture for CUDA 10 and earlier`
    );
  }

  // If the version is in CUDA_LINKS, use the corresponding URL
  if (version in CUDA_LINKS) {
    const link = CUDA_LINKS[version];
    if (os === OS.LINUX && arch === Arch.X86_64 && link.linuxX86Url) {
      return link.linuxX86Url;
    }
    if (os === OS.LINUX && arch === Arch.ARM64_SBSA && link.linuxArm64Url) {
      return link.linuxArm64Url;
    }
    if (os === OS.WINDOWS && link.windowsUrl) {
      return link.windowsUrl;
    }
  }

  // For CUDA 10 and earlier, only Linux X86_64 and Windows are supported
  // These versions' installer URLs are different from the later versions.
  if (majorVersion <= 10 && os === OS.LINUX && arch === Arch.X86_64) {
    return CUDA_LINKS[version].linuxX86Url;
  } else if (majorVersion <= 10 && os === OS.WINDOWS) {
    return CUDA_LINKS[version].windowsUrl;
  }

  // For CUDA 11 and later, the installer URLs are the same pattern for all architectures
  const md5sums = await fetchMd5sum(version);
  let targetFilename: string | undefined = undefined;
  if (os === OS.LINUX) {
    // Linux X86_64: cuda_<version>_<bundle driver version>_linux.run
    // Linux ARM64_SBSA: cuda_<version>_<bundle driver version>_linux_sbsa.run
    let pattern: RegExp;
    if (arch === Arch.X86_64) {
      pattern = new RegExp(
        `cuda_${version.replace(/\./g, '\\.')}_\\d+\\.\\d+(\\.\\d+)?_linux\\.run`
      );
    } else if (arch === Arch.ARM64_SBSA) {
      pattern = new RegExp(
        `cuda_${version.replace(/\./g, '\\.')}_\\d+\\.\\d+(\\.\\d+)?_linux_sbsa\\.run`
      );
    } else {
      throw new Error(`Unsupported architecture: ${arch}`);
    }

    for (const [filename] of Object.entries(md5sums)) {
      const match = filename.match(pattern);
      if (match) {
        targetFilename = filename;
        break;
      }
    }
  } else if (os === OS.WINDOWS) {
    // Windows: Prefer _windows.exe, fallback to _win10.exe
    let windowsFilename: string | undefined;
    let win10Filename: string | undefined;

    for (const [filename] of Object.entries(md5sums)) {
      if (filename.endsWith('_windows.exe')) {
        windowsFilename = filename;
        break; // Prefer _windows.exe, so break immediately
      } else if (filename.endsWith('_win10.exe')) {
        win10Filename = filename;
      }
    }

    targetFilename = windowsFilename || win10Filename;
  }
  if (!targetFilename) {
    throw new Error(
      `No matching CUDA installer found for version ${version} on ${os} with architecture ${arch}`
    );
  }
  return getDownloadUrl(version, 'local_installers', targetFilename);
}
