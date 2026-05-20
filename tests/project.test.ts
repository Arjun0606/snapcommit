import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { detectProject, resetProjectCache } from "../src/project.js";

const originalEnv = process.env.SNAPCOMMIT_PROJECT;

beforeEach(() => {
  resetProjectCache();
});

afterEach(() => {
  if (originalEnv === undefined) delete process.env.SNAPCOMMIT_PROJECT;
  else process.env.SNAPCOMMIT_PROJECT = originalEnv;
  resetProjectCache();
});

describe("detectProject", () => {
  it("uses SNAPCOMMIT_PROJECT env var when set", () => {
    process.env.SNAPCOMMIT_PROJECT = "explicit-name";
    expect(detectProject()).toBe("explicit-name");
  });

  it("trims whitespace from env var", () => {
    process.env.SNAPCOMMIT_PROJECT = "  spaced  ";
    expect(detectProject()).toBe("spaced");
  });

  it("returns a non-empty string in a git repo or CWD", () => {
    delete process.env.SNAPCOMMIT_PROJECT;
    // This test runs from the snapcommit repo, so git or CWD will resolve
    const result = detectProject();
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("caches the result", () => {
    process.env.SNAPCOMMIT_PROJECT = "first";
    const first = detectProject();
    process.env.SNAPCOMMIT_PROJECT = "second";
    const second = detectProject();
    expect(first).toBe(second);
  });
});
