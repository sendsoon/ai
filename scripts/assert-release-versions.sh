#!/usr/bin/env bash
# Ensure npm, PyPI, and MCP registry version fields stay in sync.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

read_version() {
  case "$1" in
    npm/package.json)
      node -p "require('./npm/package.json').version"
      ;;
    package.json)
      node -p "require('./package.json').version"
      ;;
    pypi/pyproject.toml)
      python3 -c "import re, pathlib; text = pathlib.Path('pypi/pyproject.toml').read_text(encoding='utf-8'); print(re.search(r'(?m)^version = \"([^\"]+)\"$', text).group(1))"
      ;;
    server.json)
      node -p "require('./server.json').version"
      ;;
    server.json[npm])
      node -p "require('./server.json').packages.find((p) => p.registryType === 'npm').version"
      ;;
    server.json[pypi])
      node -p "require('./server.json').packages.find((p) => p.registryType === 'pypi').version"
      ;;
    *)
      echo "unknown source: $1" >&2
      exit 1
      ;;
  esac
}

SOURCES=(
  npm/package.json
  package.json
  pypi/pyproject.toml
  server.json
  server.json[npm]
  server.json[pypi]
)

CANON="$(read_version npm/package.json)"
MISMATCH=0

echo "Release version gate (canonical: ${CANON})"

for source in "${SOURCES[@]}"; do
  version="$(read_version "$source")"
  if [ "$version" != "$CANON" ]; then
    echo "  mismatch: ${source} = ${version}" >&2
    MISMATCH=1
  else
    echo "  ok: ${source} = ${version}"
  fi
done

if [ "$MISMATCH" -ne 0 ]; then
  echo "Version mismatch: npm and PyPI release versions must match across all manifest files." >&2
  exit 1
fi

if [ -n "${EXPECTED_TAG:-}" ]; then
  tag="${EXPECTED_TAG#v}"
  if [ "$CANON" != "$tag" ]; then
    echo "Tag mismatch: git tag v${tag} but repository version is ${CANON}" >&2
    exit 1
  fi
  echo "  ok: git tag v${tag} matches repository version"
fi

echo "All release versions are consistent."
