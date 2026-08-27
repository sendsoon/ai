#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const semver = /^\d+\.\d+\.\d+(-[\w.-]+)?(\+[\w.-]+)?$/;

const sources = [
  {
    label: "npm/package.json",
    read: () => JSON.parse(fs.readFileSync(path.join(root, "npm/package.json"), "utf8")).version,
  },
  {
    label: "package.json",
    read: () => JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version,
  },
  {
    label: "pypi/pyproject.toml",
    read: () => {
      const text = fs.readFileSync(path.join(root, "pypi/pyproject.toml"), "utf8");
      return text.match(/^version = "([^"]+)"$/m)?.[1] ?? "";
    },
  },
  {
    label: "server.json",
    read: () => JSON.parse(fs.readFileSync(path.join(root, "server.json"), "utf8")).version,
  },
  {
    label: "server.json[npm]",
    read: () =>
      JSON.parse(fs.readFileSync(path.join(root, "server.json"), "utf8")).packages.find(
        (pkg) => pkg.registryType === "npm",
      ).version,
  },
  {
    label: "server.json[pypi]",
    read: () =>
      JSON.parse(fs.readFileSync(path.join(root, "server.json"), "utf8")).packages.find(
        (pkg) => pkg.registryType === "pypi",
      ).version,
  },
];

function readVersionFile() {
  const filePath = path.join(root, "VERSION");
  if (!fs.existsSync(filePath)) {
    throw new Error("VERSION file is missing at repository root.");
  }
  const version = fs.readFileSync(filePath, "utf8").trim();
  if (!version) {
    throw new Error("VERSION file is empty.");
  }
  return version;
}

function assertSemver(version) {
  if (!semver.test(version)) {
    throw new Error(`Invalid semver: ${version}`);
  }
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
  const updated = text.replace(/^version = "[^"]+"$/m, `version = "${version}"`);
  if (updated === text) {
    throw new Error("failed to update version in pypi/pyproject.toml");
  }
  fs.writeFileSync(filePath, updated);
}

function sync(versionArg) {
  const version = (versionArg ?? readVersionFile()).trim();
  assertSemver(version);
  fs.writeFileSync(path.join(root, "VERSION"), `${version}\n`);

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
}

function check() {
  const canon = readVersionFile();
  assertSemver(canon);

  console.log(`Release version gate (source: VERSION = ${canon})`);

  let mismatch = false;
  for (const source of sources) {
    const version = source.read();
    if (version !== canon) {
      console.error(`  mismatch: ${source.label} = ${version}`);
      mismatch = true;
    } else {
      console.log(`  ok: ${source.label} = ${version}`);
    }
  }

  if (mismatch) {
    console.error("Run: pnpm run version:sync");
    process.exit(1);
  }

  const expectedTag = process.env.EXPECTED_TAG?.trim();
  if (expectedTag) {
    const tag = expectedTag.replace(/^v/, "");
    if (canon !== tag) {
      console.error(`Tag mismatch: git tag v${tag} but VERSION is ${canon}`);
      console.error(`Run: pnpm run version:sync -- ${tag}`);
      process.exit(1);
    }
    console.log(`  ok: git tag v${tag} matches VERSION`);
  }

  console.log("All release versions are consistent.");
}

const [command, ...args] = process.argv.slice(2);

try {
  if (command === "sync") {
    sync(args[0]);
  } else if (command === "check") {
    check();
  } else {
    console.error("Usage: node version.mjs sync [version]");
    console.error("       node version.mjs check");
    process.exit(1);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
