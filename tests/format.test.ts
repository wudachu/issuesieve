import { describe, expect, it } from "vitest";

import { COMMENT_MARKER, formatTriageMarkdown } from "../src/format.js";
import type { TriageResult, WorkItem } from "../src/schema.js";

describe("formatTriageMarkdown", () => {
  it("includes a stable marker and human-review notice", () => {
    const item: WorkItem = {
      repository: "acme/widgets",
      number: 5,
      type: "issue",
      title: "Example",
      body: "Example body",
      author: "lee",
      labels: [],
    };
    const result: TriageResult = {
      kind: "documentation",
      priority: "p3",
      confidence: 0.91,
      summary: "A documentation correction.",
      suggested_labels: ["docs"],
      missing_information: [],
      maintainer_actions: ["Review the proposed wording"],
      response_draft: "Thanks for the report.",
      needs_human_attention: false,
      attention_reason: "",
    };

    const markdown = formatTriageMarkdown(item, result);
    expect(markdown).toContain(COMMENT_MARKER);
    expect(markdown).toContain("91%");
    expect(markdown).toContain("A maintainer must review it before acting");
  });
});
