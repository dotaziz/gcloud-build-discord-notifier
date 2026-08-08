import { describe, it, expect } from "vitest";
import { compileFilter } from "../src/filter";
import type { Build } from "../src/ types";

const build = (over: Partial<Build> = {}): Build => ({
  id: "b1", projectId: "p", status: "SUCCESS", logUrl: "", ...over,
});

it("passes everything when no filter is configured", () => {
  expect(compileFilter(undefined)(build())).toBe(true);
});

it("filters by status allow-list", () => {
  const predicate = compileFilter({ statuses: ["FAILURE"] });
  expect(predicate(build({ status: "SUCCESS" }))).toBe(false);
  expect(predicate(build({ status: "FAILURE" }))).toBe(true);
});
