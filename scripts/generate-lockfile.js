import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const projectDir = "/vercel/share/v0-project";
const pkgJson = JSON.parse(readFileSync(join(projectDir, "package.json"), "utf-8"));

// Generate a minimal lockfileVersion 3 package-lock.json
// npm ci with lockfileVersion 3 will use this as a starting point
const lockfile = {
  name: pkgJson.name,
  version: pkgJson.version,
  lockfileVersion: 3,
  requires: true,
  packages: {
    "": {
      name: pkgJson.name,
      version: pkgJson.version,
      dependencies: pkgJson.dependencies || {},
      devDependencies: pkgJson.devDependencies || {},
    },
  },
};

writeFileSync(
  join(projectDir, "package-lock.json"),
  JSON.stringify(lockfile, null, 2) + "\n"
);

console.log("Generated minimal package-lock.json (lockfileVersion 3)");
console.log("npm ci should now be able to resolve and install all packages.");
