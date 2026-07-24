import { describe, expect, it } from "vitest";

import { formatReleaseNotesMarkdown } from "../src/format.js";
import { MockAnalyzer } from "../src/mock-analyzer.js";
import { ReleaseNotesSchema, type ReleaseRequest } from "../src/schema.js";

const release: ReleaseRequest = {
  repository: "acme/widgets",
  version: "v1.1.0",
  previous_version: "v1.0.0",
  pull_requests: [
    {
      number: 10,
      title: "Fix parser crash",
      body: "Avoids a crash for empty input.",
      author: "lee",
      labels: ["bug"],
      url: "https://github.com/acme/widgets/pull/10",
    },
    {
      number: 11,
      title: "Add JSON output",
      body: "Adds a machine-readable output mode.",
      author: "maya",
      labels: ["feature"],
    },
  ],
};

describe("release notes", () => {
  it("includes every pull request and contributor", async () => {
    const notes = await new MockAnalyzer().releaseNotes(release);
    expect(ReleaseNotesSchema.parse(notes)).toEqual(notes);
    const markdown = formatReleaseNotesMarkdown(release, notes);
    expect(markdown).toContain("[#10](https://github.com/acme/widgets/pull/10)");
    expect(markdown).toContain("[#11](https://github.com/acme/widgets/pull/11)");
    expect(markdown).toContain("@lee");
    expect(markdown).toContain("@maya");
  });
});
