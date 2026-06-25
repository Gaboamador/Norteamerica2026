import { mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

function getGitSha() {
  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

const version = {
  buildId: `${Date.now()}-${getGitSha()}`,
  builtAt: new Date().toISOString(),
};

mkdirSync("public", { recursive: true });

writeFileSync(
  "public/version.json",
  `${JSON.stringify(version, null, 2)}\n`
);

console.log("Generated public/version.json", version);