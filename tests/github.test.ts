import { describe, expect, it } from "vitest";

import { fetchGitHubWorkItem, parseGitHubIssueUrl } from "../src/github.js";

describe("parseGitHubIssueUrl", () => {
  it("parses issue and pull request URLs", () => {
    expect(parseGitHubIssueUrl("https://github.com/openai/codex/issues/123")).toEqual({
      owner: "openai",
      repo: "codex",
      number: 123,
    });
    expect(parseGitHubIssueUrl("https://github.com/openai/codex/pull/456")).toEqual({
      owner: "openai",
      repo: "codex",
      number: 456,
    });
  });

  it("rejects other hosts and malformed paths", () => {
    expect(() => parseGitHubIssueUrl("https://example.com/a/b/issues/1")).toThrow(
      "Only github.com",
    );
    expect(() => parseGitHubIssueUrl("https://github.com/a/b/issues/nope")).toThrow(
      "Expected a URL like",
    );
  });
});

describe("fetchGitHubWorkItem", () => {
  it("normalizes GitHub's issue response", async () => {
    const fetcher = async () =>
      new Response(
        JSON.stringify({
          number: 7,
          title: "Broken output",
          body: "Steps to reproduce",
          html_url: "https://github.com/acme/widgets/issues/7",
          user: { login: "lee" },
          labels: ["bug", { name: "needs-triage" }, { name: null }],
        }),
        { status: 200 },
      );

    await expect(
      fetchGitHubWorkItem(
        "https://github.com/acme/widgets/issues/7",
        undefined,
        fetcher as typeof fetch,
      ),
    ).resolves.toMatchObject({
      repository: "acme/widgets",
      number: 7,
      type: "issue",
      author: "lee",
      labels: ["bug", "needs-triage"],
    });
  });
});
