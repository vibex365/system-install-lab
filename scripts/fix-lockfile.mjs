import { execSync } from "child_process";

console.log("Regenerating package-lock.json...");
execSync("npm install --package-lock-only", {
  cwd: "/vercel/share/v0-project",
  stdio: "inherit",
});
console.log("package-lock.json regenerated successfully.");
