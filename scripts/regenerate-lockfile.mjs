import { execSync } from "child_process";

try {
  console.log("Running npm install to regenerate package-lock.json...");
  const output = execSync("npm install --prefer-offline 2>&1", {
    cwd: "/vercel/share/v0-project",
    encoding: "utf-8",
    timeout: 120000,
  });
  console.log(output);
  console.log("package-lock.json regenerated successfully.");
} catch (error) {
  console.error("Error during npm install:", error.stdout || error.message);
  process.exit(1);
}
