import { describe, it, expect } from "vitest";
import { statusEmbeds } from "../src/embeds";
import type { Build } from "../src/ types";

describe("statusEmbeds", () => {
  it("returns a SUCCESS embed", () => {
    const build: Build = {
      id: "b1", projectId: "p", status: "SUCCESS",
      logUrl: "https://example.com/log?foo=bar",
    };
    expect(statusEmbeds(build, build.logUrl)).toEqual([
      { title: "✅ SUCCESS", color: 1127128 },
    ]);
  });

  it("returns [] for unhandled statuses instead of throwing", () => {
    const build: Build = { id: "b1", projectId: "p", status: "QUEUED", logUrl: "" };
    expect(statusEmbeds(build, "")).toEqual([]);
  });

  it("handles a build with no source", () => {
    const build: Build = { id: "b1", projectId: "p", status: "SUCCESS", logUrl: "" };
    expect(() => statusEmbeds(build, "")).not.toThrow();
  });
});
