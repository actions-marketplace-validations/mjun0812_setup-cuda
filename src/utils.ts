/**
 * Compare two version strings
 * @param a - First version string
 * @param b - Second version string
 * @returns Negative if a < b, 0 if a === b, positive if a > b
 */
export function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal !== bVal) {
      return aVal - bVal;
    }
  }
  return 0;
}

/**
 * Sort versions using semantic versioning
 * @param versions - Array of version strings
 * @returns Sorted array of version strings
 */
export function sortVersions(versions: string[]): string[] {
  return versions.sort(compareVersions);
}
