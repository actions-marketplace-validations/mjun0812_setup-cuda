# setup-cuda

Set up a specific version of NVIDIA CUDA in GitHub Actions.

## Usage

```yaml
steps:
  - name: Setup CUDA
    uses: mjun0812/setup-cuda@v1
    with:
      version: 12
```

## Inputs

### `version`

The version of NVIDIA CUDA to install.

- Format: `Major.Minor.Patch` (e.g., `12.4.1`) or `Major.Minor` (e.g., `12.4`).
- `latest`: Install the latest available version.
- If the Patch version is omitted, the latest Patch version for that Major.Minor will be installed.

**Default:** `latest`

### `method`

The method to use to install CUDA.

- `auto`: Tries to install using the `network` method first. If it fails or is not available, falls back to `local`.
- `network`: Uses the CUDA network installer. Faster download, but supported combinations of CUDA versions and OS are limited.
- `local`: Downloads the full local installer. More robust availability, but larger download size.

**Default:** `auto`

## Outputs

### `version`

The full version string of NVIDIA CUDA that was actually installed (e.g., `12.4.1`).

### `cuda-path`

The absolute path to the NVIDIA CUDA installation directory.

This action also sets the following environment variables:

- `CUDA_PATH`: Set to the installation directory.
- `CUDA_HOME`: Set to the installation directory.
- `PATH`: Prepend `${CUDA_PATH}/bin`.
- `LD_LIBRARY_PATH`: (Linux only) Prepend `${CUDA_PATH}/lib64`.
- (Windows only) Prepend `${CUDA_PATH}/lib/x64` to `PATH`.

## Questions

### What is the difference between this repository and [Jimver/cuda-toolkit](https://github.com/Jimver/cuda-toolkit)?

[Jimver/cuda-toolkit](https://github.com/Jimver/cuda-toolkit) is a same Github Action for installing NVIDIA CUDA.
That action installs CUDA from hard-coded URLs, whereas this repository installs CUDA from dynamically generated URLs. Therefore, you can download the latest CUDA without waiting for the Action to be updated.
In addition, it supports specifying versions as `latest` or by major/minor version, and automatically selects between `network` and `local` installers.
