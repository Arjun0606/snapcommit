import { describe, it, expect } from "vitest";
import { parsePageId } from "../src/notion.js";

describe("parsePageId", () => {
  it("extracts ID from a full Notion URL with title", () => {
    const url = "https://www.notion.so/My-Page-abcdef1234567890abcdef1234567890";
    expect(parsePageId(url)).toBe("abcdef12-3456-7890-abcd-ef1234567890");
  });

  it("extracts ID from a workspace-scoped URL", () => {
    const url = "https://www.notion.so/myworkspace/abcdef1234567890abcdef1234567890";
    expect(parsePageId(url)).toBe("abcdef12-3456-7890-abcd-ef1234567890");
  });

  it("accepts an already-hyphenated ID", () => {
    const id = "abcdef12-3456-7890-abcd-ef1234567890";
    expect(parsePageId(id)).toBe(id);
  });

  it("accepts a raw 32-char hex ID", () => {
    expect(parsePageId("abcdef1234567890abcdef1234567890")).toBe(
      "abcdef12-3456-7890-abcd-ef1234567890",
    );
  });

  it("strips query params and fragments", () => {
    expect(parsePageId("https://www.notion.so/Page-abcdef1234567890abcdef1234567890?v=foo#bar")).toBe(
      "abcdef12-3456-7890-abcd-ef1234567890",
    );
  });

  it("returns null for non-Notion strings", () => {
    expect(parsePageId("not a page id")).toBeNull();
    expect(parsePageId("")).toBeNull();
    expect(parsePageId("https://example.com")).toBeNull();
  });

  it("returns null for too-short hex strings", () => {
    expect(parsePageId("abcdef12")).toBeNull();
  });
});
