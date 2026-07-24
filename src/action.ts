import { appendFile, readFile } from "node:fs/promises";

import { OpenAIAnalyzer } from "./analyzer.js";
import { COMMENT_MARKER, formatTriageMarkdown } from "./format.js";
import { WorkItemSchema, type WorkItem } from "./schema.js";

interface GitHubEventItem {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  user: { login: string } | null;
  labels: Array<{ name?: string | null }>;
}

interface GitHubEvent {
  repository: { full_name: string };
  issue?: GitHubEventItem;
  pull_request?: GitHubEventItem;
}

interface GitHubComment {
  id: number;
  body: string | null;
}

function eventToWorkItem(event: GitHubEvent): WorkItem {
  const source = event.issue ?? event.pull_request;
  if (!source) throw new Error("This action supports issue and pull request events only.");

  return WorkItemSchema.parse({
    repository: event.repository.full_name,
    number: source.number,
    type: event.pull_request ? "pull_request" : "issue",
    title: source.title,
    body: source.body ?? "",
    author: source.user?.login ?? "unknown",
    labels: source.labels.map((label) => label.name).filter(Boolean),
    url: source.html_url,
  });
}

async function githubRequest(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "IssueSieve-Action",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API request failed with ${response.status} ${response.statusText}.`);
  }
  return response;
}

async function upsertComment(repository: string, issueNumber: number, body: string, token: string) {
  const commentsResponse = await githubRequest(
    `/repos/${repository}/issues/${issueNumber}/comments?per_page=100`,
    token,
  );
  const comments = (await commentsResponse.json()) as GitHubComment[];
  const existing = comments.find((comment) => comment.body?.includes(COMMENT_MARKER));

  if (existing) {
    await githubRequest(`/repos/${repository}/issues/comments/${existing.id}`, token, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
    return;
  }

  await githubRequest(`/repos/${repository}/issues/${issueNumber}/comments`, token, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

async function main(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error("GITHUB_EVENT_PATH is not set.");

  const event = JSON.parse(await readFile(eventPath, "utf8")) as GitHubEvent;
  const item = eventToWorkItem(event);
  const result = await new OpenAIAnalyzer().triage(item);
  const markdown = formatTriageMarkdown(item, result);

  console.log(markdown);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) await appendFile(summaryPath, `${markdown}\n`, "utf8");

  if ((process.env.ISSUESIEVE_POST_COMMENT ?? "true") !== "true") return;
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required when post-comment is true.");
  await upsertComment(item.repository, item.number, markdown, token);
}

main().catch((error: unknown) => {
  console.error(`IssueSieve action failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
