#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for the SendSoon AI MCP monorepo.
# Prepares both packages: the Node workspace (@sendsoon/mcp) and the PyPI
# package (sendsoon-mcp, installed into pypi/.venv).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# System dependency: the stdlib venv/ensurepip module. It is required both to
# create pypi/.venv and for `python -m build`'s isolated build environments.
# The Cursor default image ships Python 3.12 without it, so install on demand.
if ! python3 -c "import ensurepip" >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y python3-venv
fi

# Node workspace: install the exact locked dependency tree.
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

# PyPI package: isolate dev tooling (ruff, mypy, pytest, build, twine) in a
# project-local virtualenv so it never touches system site-packages.
cd "$ROOT/pypi"
if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
. .venv/bin/activate
python -m pip install --quiet --upgrade pip
python -m pip install -e ".[dev]" build twine

echo "Environment ready: Node workspace installed; PyPI venv at pypi/.venv"
