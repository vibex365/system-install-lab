import { readdirSync, existsSync } from "fs";
import path from "path";

// Discover environment
console.log("process.execPath:", process.execPath);
console.log("process.env.PATH:", process.env.PATH);

// Search for npm in PATH directories
const pathDirs = (process.env.PATH || "").split(":");
for (const dir of pathDirs) {
  try {
    const files = readdirSync(dir);
    const npmFiles = files.filter((f) => f.startsWith("npm") || f.startsWith("node"));
    if (npmFiles.length > 0) {
      console.log(`Found in ${dir}:`, npmFiles.join(", "));
    }
  } catch (e) {
    // skip unreadable dirs
  }
}

// Also check common locations
const checkPaths = [
  "/usr/local/bin",
  "/usr/bin",
  "/usr/local/lib/node_modules/npm",
  "/usr/local/lib/node_modules",
  "/opt",
  "/home/vercel-sandbox/.nvm",
];

for (const p of checkPaths) {
  if (existsSync(p)) {
    try {
      console.log(`Contents of ${p}:`, readdirSync(p).join(", "));
    } catch (e) {
      console.log(`Cannot read ${p}:`, e.message);
    }
  } else {
    console.log(`${p} does not exist`);
  }
}
