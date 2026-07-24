import { WorkItemSchema, type WorkItem } from "./schema.js";

export interface GitHubIssueReference {
  owner: string;
  repo: string;
  number: number;
}

interface GitHubIssueResponse {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  user: { login: string } | null;
  labels: Array<string | { name?: string | null }>;
  pull_request?: unknown;
}

export function parseGitHubIssueUrl(value: string): GitHubIssueReference {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Expected a GitHub issue or pull request URL.");
  }

  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    throw new Error("Only github.com URLs are supported.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const [owner, repo, resource, rawNumber] = parts;
  const number = Number(rawNumber);
  if (!owner || !repo || !["issues", "pull"].includes(resource ?? "") || !Number.isInteger(number) || number < 1) {
    throw new Error("Expected a URL like https://github.com/owner/repo/issues/123.");
  }

  return { owner, repo, number };
}

export async function fetchGitHubWorkItem(
  value: string,
  token = process.env.GITHUB_TOKEN,
  fetcher: typeof fetch = fetch,
): Promise<WorkItem> {
  const reference = parseGitHubIssueUrl(value);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "IssueSieve",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetcher(
    `https://api.github.com/repos/${reference.owner}/${reference.repo}/issues/${reference.number}`,
    { headers },
  );
  if (!response.ok) {
    throw new Error(`GitHub API request failed with ${response.status} ${response.statusText}.`);
  }

  const data = (await response.json()) as GitHubIssueResponse;
  return WorkItemSchema.parse({
    repository: `${reference.owner}/${reference.repo}`,
    number: data.number,
    type: data.pull_request ? "pull_request" : "issue",
    title: data.title,
    body: data.body ?? "",
    author: data.user?.login ?? "unknown",
    labels: data.labels
      .map((label) => (typeof label === "string" ? label : label.name))
      .filter((label): label is string => Boolean(label)),
    url: data.html_url,
  });
}
