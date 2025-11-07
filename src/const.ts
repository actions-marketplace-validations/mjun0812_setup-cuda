// START_SUPPORTED_CUDA_VERSION: The first version that this repository supports.
export const START_SUPPORTED_CUDA_VERSION: string = '10.0';

// OLD_CUDA_VERSIONS: These installer's links are different format from the CUDA 11.0 and later.
export const OLD_CUDA_VERSIONS: string[] = [
  // This repository only supports CUDA 10.0 and later.
  '10.0',
  '10.1',
  '10.1.1', // 10.1 update1
  '10.1.2', // 10.1 update2
  '10.2',
];

export interface CudaLink {
  md5sumUrl: string;
  linuxX86Url: string;
  linuxArm64Url: string;
  windowsUrl: string;
}

export const CUDA_LINKS: Record<string, CudaLink> = {
  // '10.0.130': {
  '10.0': {
    md5sumUrl:
      'https://developer.download.nvidia.com/compute/cuda/10.0/Prod/docs/sidebar/md5sum.txt',
    linuxX86Url:
      'http://developer.download.nvidia.com/compute/cuda/10.0/Prod/patches/1/cuda_10.0.130.1_linux.run',
    linuxArm64Url: '',
    windowsUrl:
      'https://developer.nvidia.com/compute/cuda/10.0/Prod/local_installers/cuda_10.0.130_411.31_win10',
  },
  // '10.1.105': {
  '10.1': {
    md5sumUrl:
      'https://developer.download.nvidia.com/compute/cuda/10.1/Prod/docs/sidebar/md5sum.txt',
    linuxX86Url:
      'https://developer.nvidia.com/compute/cuda/10.1/Prod/local_installers/cuda_10.1.105_418.39_linux.run',
    linuxArm64Url: '',
    windowsUrl:
      'https://developer.nvidia.com/compute/cuda/10.1/Prod/local_installers/cuda_10.1.105_418.96_win10.exe',
  },
  // '10.1.168': {
  '10.1.1': {
    // 10.1 update1
    md5sumUrl:
      'https://developer.download.nvidia.com/compute/cuda/10.1/Prod/docs2/sidebar/md5sum-2.txt',
    linuxX86Url:
      'https://developer.nvidia.com/compute/cuda/10.1/Prod/local_installers/cuda_10.1.168_418.67_linux.run',
    linuxArm64Url: '',
    windowsUrl:
      'https://developer.nvidia.com/compute/cuda/10.1/Prod/local_installers/cuda_10.1.168_425.25_win10.exe',
  },
  // '10.1.243': {
  '10.1.2': {
    // 10.1 update2
    md5sumUrl:
      'https://developer.download.nvidia.com/compute/cuda/10.1/Prod/docs3/sidebar/md5sum.txt',
    linuxX86Url:
      'https://developer.download.nvidia.com/compute/cuda/10.1/Prod/local_installers/cuda_10.1.243_418.87.00_linux.run',
    linuxArm64Url: '',
    windowsUrl:
      'https://developer.download.nvidia.com/compute/cuda/10.1/Prod/local_installers/cuda_10.1.243_426.00_win10.exe',
  },
  '10.2': {
    md5sumUrl:
      'https://developer.download.nvidia.com/compute/cuda/10.2/Prod/docs/sidebar/md5sum2.txt',
    linuxX86Url:
      'https://developer.download.nvidia.com/compute/cuda/10.2/Prod/patches/2/cuda_10.2.2_linux.run',
    linuxArm64Url: '',
    windowsUrl:
      'https://developer.download.nvidia.com/compute/cuda/10.2/Prod/local_installers/cuda_10.2.89_441.22_win10.exe',
  },
};
