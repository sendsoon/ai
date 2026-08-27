#!/usr/bin/env node
/**
 * Single source of truth: VERSION (or pass version as argv[2]).
 * Propagates to npm, PyPI, and MCP registry manifest files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readVersionArg() {
  const arg = process.argv[2]?.trim();
  if (arg) {
    return arg;
  }
  const versionFile = path.join(root, "VERSION");
  if (!fs.existsSync(versionFile)) {
    console.error("VERSION file missing; pass version as an argument.");
    process.exit(1);
  }
  return fs.readFileSync(versionFile, "utf8").trim();
}

function writeJsonIfChanged(relativePath, mutator) {
  const filePath = path.join(root, relativePath);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  mutator(data);
  const next = `${JSON.stringify(data, null, 2)}\n`;
  const current = fs.readFileSync(filePath, "utf8");
  if (current !== next) {
    fs.writeFileSync(filePath, next);
  }
}

function syncPyproject(version) {
  const filePath = path.join(root, "pypi/pyproject.toml");
  const text = fs.readFileSync(filePath, "utf8");
  const current = text.match(/^version = "([^"]+)"$/m)?.[1];
  if (current === version) {
    return;
  }
  const updated = text.replace(
    /^version = "[^"]+"$/m,
    `version = "${version}"`,
  );
  if (updated === text) {
    throw new Error("failed to update version in pypi/pyproject.toml");
  }
  fs.writeFileSync(filePath, updated);
}

const version = readVersionArg();
if (!/^\d+\.\d+\.\d+(-[\w.-]+)?(\+[\w.-]+)?$/.test(version)) {
  console.error(`Invalid semver: ${version}`);
  process.exit(1);
}

const versionFile = path.join(root, "VERSION");
const currentVersion = fs.existsSync(versionFile)
  ? fs.readFileSync(versionFile, "utf8").trim()
  : "";
if (currentVersion !== version) {
  fs.writeFileSync(versionFile, `${version}\n`);
}

writeJsonIfChanged("package.json", (pkg) => {
  pkg.version = version;
});

writeJsonIfChanged("npm/package.json", (pkg) => {
  pkg.version = version;
});

writeJsonIfChanged("server.json", (server) => {
  server.version = version;
  for (const pkg of server.packages ?? []) {
    pkg.version = version;
  }
});

syncPyproject(version);

console.log(`Synced release version ${version} from VERSION to all manifests.`);
