import type { Analyzer } from "./analyzer.js";
import type { ReleaseNotes, ReleaseRequest, TriageResult, WorkItem } from "./schema.js";

const SECURITY_PATTERN = /\b(cve|xss|csrf|rce|vulnerab|exploit|secret|token)\b/i;
const BUG_PATTERN = /\b(bugs?|errors?|crash(?:es|ed|ing)?|fail(?:s|ed|ing|ure)?|broken|exceptions?)\b/i;
const FEATURE_PATTERN = /\b(feature|request|support|proposal|enhancement)\b/i;

export class MockAnalyzer implements Analyzer {
  async triage(item: WorkItem): Promise<TriageResult> {
    const text = `${item.title}\n${item.body}`;
    const isSecurity = SECURITY_PATTERN.test(text);
    const isBug = BUG_PATTERN.test(text);
    const isFeature = FEATURE_PATTERN.test(text);
    const missingInformation: string[] = [];

    if (item.body.trim().length < 80) {
      missingInformation.push("A fuller description of the observed and expected behavior");
    }
    if (isBug && !/repro|steps|example/i.test(item.body)) {
      missingInformation.push("Minimal reproduction steps or a small example");
    }
    if (isBug && !/version|v\d|commit/i.test(item.body)) {
      missingInformation.push("Affected project version or commit");
    }

    const kind: TriageResult["kind"] = isSecurity
      ? "security"
      : isBug
        ? "bug"
        : isFeature
          ? "feature"
          : "other";

    return {
      kind,
      priority: isSecurity ? "p1" : isBug ? "p2" : "p3",
      confidence: 0.78,
      summary: `${item.type === "issue" ? "Issue" : "Pull request"} about ${item.title.toLowerCase()}.`,
      suggested_labels: [
        kind === "other" ? "needs-triage" : kind,
        missingInformation.length > 0 ? "needs-info" : "ready-for-review",
      ],
      missing_information: missingInformation,
      maintainer_actions: isSecurity
        ? ["Move the discussion to the project's private security channel", "Ask a security maintainer to review"]
        : ["Confirm the classification and suggested labels", "Review the proposed contributor response"],
      response_draft: isSecurity
        ? "Thanks for the report. This may be security-sensitive. Please follow the private reporting process in SECURITY.md so the maintainers can review it safely."
        : missingInformation.length > 0
          ? `Thanks for opening this. Before we can evaluate it, could you add: ${missingInformation.join("; ")}?`
          : "Thanks for the clear report. A maintainer will review the proposed scope and next steps; we cannot promise a timeline yet.",
      needs_human_attention: isSecurity,
      attention_reason: isSecurity ? "The report contains possible security-sensitive language." : "",
    };
  }

  async releaseNotes(release: ReleaseRequest): Promise<ReleaseNotes> {
    const sections = new Map<string, ReleaseNotes["sections"][number]["items"]>();
    for (const pullRequest of release.pull_requests) {
      const text = `${pullRequest.title} ${pullRequest.body} ${pullRequest.labels.join(" ")}`;
      const heading = /fix|bug/i.test(text)
        ? "Fixed"
        : /doc/i.test(text)
          ? "Documentation"
          : /feat|add|new/i.test(text)
            ? "Added"
            : "Changed";
      const items = sections.get(heading) ?? [];
      items.push({
        pull_request: pullRequest.number,
        title: pullRequest.title,
        description: pullRequest.body.split("\n")[0]?.trim() || pullRequest.title,
        contributor: pullRequest.author,
        breaking: /breaking/i.test(text),
      });
      sections.set(heading, items);
    }

    return {
      version: release.version,
      overview: `This release includes ${release.pull_requests.length} merged contribution${release.pull_requests.length === 1 ? "" : "s"}.`,
      sections: [...sections].map(([heading, items]) => ({ heading, items })),
      upgrade_notes: release.pull_requests.some((item) => /breaking/i.test(`${item.title} ${item.body}`))
        ? ["Review the breaking changes below before upgrading."]
        : [],
    };
  }
}
