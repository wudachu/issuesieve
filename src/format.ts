import type { ReleaseNotes, ReleaseRequest, TriageResult, WorkItem } from "./schema.js";

export const COMMENT_MARKER = "<!-- issuesieve:triage -->";

function list(items: string[], empty: string): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : `- ${empty}`;
}

export function formatTriageMarkdown(item: WorkItem, result: TriageResult): string {
  const attention = result.needs_human_attention
    ? `\n> [!WARNING]\n> Human attention required: ${result.attention_reason}\n`
    : "";

  return `${COMMENT_MARKER}
## IssueSieve triage suggestion

| Field | Suggestion |
| --- | --- |
| Item | ${item.type === "issue" ? "Issue" : "Pull request"} #${item.number} |
| Kind | \`${result.kind}\` |
| Priority | \`${result.priority}\` |
| Confidence | ${Math.round(result.confidence * 100)}% |
| Labels | ${result.suggested_labels.map((label) => `\`${label}\``).join(", ") || "None"} |
${attention}
### Summary

${result.summary}

### Missing information

${list(result.missing_information, "Nothing obvious")}

### Suggested maintainer actions

${list(result.maintainer_actions, "Review manually")}

<details>
<summary>Suggested reply</summary>

${result.response_draft}

</details>

_AI-generated suggestion. A maintainer must review it before acting._`;
}

export function formatReleaseNotesMarkdown(
  release: ReleaseRequest,
  notes: ReleaseNotes,
): string {
  const sections = notes.sections
    .map(
      (section) => `## ${section.heading}\n\n${section.items
        .map(
          (item) =>
            `- ${item.breaking ? "**Breaking:** " : ""}${item.description} ([#${item.pull_request}](${release.pull_requests.find((pullRequest) => pullRequest.number === item.pull_request)?.url ?? `https://github.com/${release.repository}/pull/${item.pull_request}`})) — @${item.contributor}`,
        )
        .join("\n")}`,
    )
    .join("\n\n");
  const upgradeNotes =
    notes.upgrade_notes.length > 0
      ? `\n\n## Upgrade notes\n\n${list(notes.upgrade_notes, "No special steps")}`
      : "";

  return `# ${release.repository} ${notes.version}\n\n${notes.overview}\n\n${sections}${upgradeNotes}`;
}
