#!/usr/bin/env bash
# Verify all manifest versions match the single source of truth: VERSION.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f VERSION ]; then
  echo "VERSION file is missing at repository root." >&2
  exit 1
fi

CANON="$(tr -d '\r\n' < VERSION)"
if [ -z "$CANON" ]; then
  echo "VERSION file is empty." >&2
  exit 1
fi

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

MISMATCH=0

echo "Release version gate (source: VERSION = ${CANON})"

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
  echo "Run: node scripts/sync-release-versions.mjs" >&2
  exit 1
fi

if [ -n "${EXPECTED_TAG:-}" ]; then
  tag="${EXPECTED_TAG#v}"
  if [ "$CANON" != "$tag" ]; then
    echo "Tag mismatch: git tag v${tag} but VERSION is ${CANON}" >&2
    echo "Run: node scripts/sync-release-versions.mjs ${tag}" >&2
    exit 1
  fi
  echo "  ok: git tag v${tag} matches VERSION"
fi

echo "All release versions are consistent."
