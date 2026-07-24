import { describe, expect, it } from "vitest";

import { MockAnalyzer } from "../src/mock-analyzer.js";
import { TriageResultSchema, type WorkItem } from "../src/schema.js";

const baseItem: WorkItem = {
  repository: "acme/widgets",
  number: 1,
  type: "issue",
  title: "Build crashes",
  body: "The build crashes every time.",
  author: "contributor",
  labels: [],
};

describe("MockAnalyzer", () => {
  it("produces a valid offline bug triage", async () => {
    const result = await new MockAnalyzer().triage(baseItem);
    expect(TriageResultSchema.parse(result)).toEqual(result);
    expect(result.kind).toBe("bug");
    expect(result.missing_information.length).toBeGreaterThan(0);
  });

  it("routes possible vulnerabilities to human attention", async () => {
    const result = await new MockAnalyzer().triage({
      ...baseItem,
      title: "Possible token vulnerability",
    });
    expect(result.kind).toBe("security");
    expect(result.needs_human_attention).toBe(true);
    expect(result.response_draft).toContain("SECURITY.md");
  });
});
