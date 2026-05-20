/**
 * Project auto-detection. When the AI calls save_memory without a project,
 * we try to infer it from the user's environment. Heuristics in priority:
 *   1. SNAPCOMMIT_PROJECT env var (explicit override)
 *   2. Git remote origin basename (most reliable signal)
 *   3. CWD basename (fallback)
 */
import { execSync } from "node:child_process";
import { basename } from "node:path";

let cached: string | null | undefined = undefined;

function fromEnv(): string | null {
  const v = process.env.SNAPCOMMIT_PROJECT;
  return v && v.trim() ? v.trim() : null;
}

function fromGit(): string | null {
  try {
    const remote = execSync("git config --get remote.origin.url", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 1000,
    }).trim();
    if (!remote) return null;
    // matches: git@github.com:org/repo.git, https://github.com/org/repo.git, etc.
    const match = remote.match(/[/:]([^/:]+?)(?:\.git)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function fromCwd(): string {
  return basename(process.cwd());
}

export function detectProject(): string | null {
  if (cached !== undefined) return cached;
  cached = fromEnv() ?? fromGit() ?? fromCwd();
  return cached;
}

// for tests
export function resetProjectCache(): void {
  cached = undefined;
}
