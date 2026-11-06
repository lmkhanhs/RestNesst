#!/usr/bin/env bash
set -euo pipefail

directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
version="1.16.0"
checksum="ca04ab10581c019ed3e905d0331b51faaed8e48f92d97fe592ce2312acf3769f"
if [[ "$(uname -sm)" != "Linux x86_64" ]]; then
  echo "This installer pins the Linux AMD64 release. See README.md for other platforms." >&2
  exit 1
fi
mkdir -p "$directory/.bin"
download="$(mktemp "$directory/.bin/toolbox.XXXXXX")"
trap 'rm -f -- "$download"' EXIT
curl --fail --location --silent --show-error \
  "https://storage.googleapis.com/mcp-toolbox-for-databases/v${version}/linux/amd64/toolbox" \
  -o "$download"
printf '%s  %s\n' "$checksum" "$download" | sha256sum --check --status
chmod 755 "$download"
mv -- "$download" "$directory/.bin/toolbox"
"$directory/.bin/toolbox" --version
