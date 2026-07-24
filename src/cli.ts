import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { OpenAIAnalyzer, type Analyzer } from "./analyzer.js";
import { formatReleaseNotesMarkdown, formatTriageMarkdown } from "./format.js";
import { fetchGitHubWorkItem } from "./github.js";
import { MockAnalyzer } from "./mock-analyzer.js";
import {
  ReleaseRequestSchema,
  WorkItemSchema,
  type ReleaseRequest,
  type WorkItem,
} from "./schema.js";

const VERSION = "0.1.0";

const DEMO_ITEM: WorkItem = {
  repository: "acme/widgets",
  number: 42,
  type: "issue",
  title: "CLI crashes when the config file is missing",
  body: "Running `widgets build` on version 2.3.0 throws an exception when `.widgetsrc` does not exist. I expected the command to use defaults.",
  author: "sample-contributor",
  labels: ["needs-triage"],
  url: "https://github.com/acme/widgets/issues/42",
};

interface ParsedArguments {
  command: string;
  file: string | undefined;
  url: string | undefined;
  format: "markdown" | "json";
  mock: boolean;
}

function usage(): string {
  return `IssueSieve ${VERSION}

Human-in-the-loop triage for GitHub issues and pull requests.

Usage:
  issuesieve demo [--format markdown|json]
  issuesieve triage --file <work-item.json> [--mock] [--format markdown|json]
  issuesieve triage --url <github-url> [--mock] [--format markdown|json]
  issuesieve release --file <release.json> [--mock] [--format markdown|json]

Environment:
  OPENAI_API_KEY   Required unless --mock is used
  OPENAI_MODEL     Optional; defaults to gpt-5.6-sol
  GITHUB_TOKEN     Optional for public URLs; recommended for higher rate limits

IssueSieve only prints suggestions. It does not edit labels or post comments from the CLI.`;
}

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}

export function parseArguments(args: string[]): ParsedArguments {
  const command = args[0] ?? "help";
  const rawFormat = valueAfter(args, "--format") ?? "markdown";
  if (rawFormat !== "markdown" && rawFormat !== "json") {
    throw new Error("--format must be markdown or json.");
  }

  return {
    command,
    file: valueAfter(args, "--file"),
    url: valueAfter(args, "--url"),
    format: rawFormat,
    mock: args.includes("--mock") || command === "demo",
  };
}

async function loadWorkItem(args: ParsedArguments): Promise<WorkItem> {
  if (args.command === "demo") return DEMO_ITEM;
  if (args.file && args.url) throw new Error("Use either --file or --url, not both.");
  if (args.file) {
    const raw = await readFile(args.file, "utf8");
    return WorkItemSchema.parse(JSON.parse(raw));
  }
  if (args.url) return fetchGitHubWorkItem(args.url);
  throw new Error("triage requires --file <path> or --url <github-url>.");
}

function createAnalyzer(args: ParsedArguments): Analyzer {
  return args.mock ? new MockAnalyzer() : new OpenAIAnalyzer();
}

export async function runCli(argv = process.argv.slice(2)): Promise<number> {
  const args = parseArguments(argv);
  if (["help", "--help", "-h"].includes(args.command)) {
    console.log(usage());
    return 0;
  }
  if (["version", "--version", "-v"].includes(args.command)) {
    console.log(VERSION);
    return 0;
  }
  if (!["demo", "triage", "release"].includes(args.command)) {
    throw new Error(`Unknown command: ${args.command}\n\n${usage()}`);
  }

  if (args.command === "release") {
    if (!args.file) throw new Error("release requires --file <release.json>.");
    if (args.url) throw new Error("release does not support --url.");
    const raw = await readFile(args.file, "utf8");
    const release: ReleaseRequest = ReleaseRequestSchema.parse(JSON.parse(raw));
    const notes = await createAnalyzer(args).releaseNotes(release);
    console.log(
      args.format === "json"
        ? JSON.stringify({ release, notes }, null, 2)
        : formatReleaseNotesMarkdown(release, notes),
    );
    return 0;
  }

  const item = await loadWorkItem(args);
  const result = await createAnalyzer(args).triage(item);
  console.log(
    args.format === "json"
      ? JSON.stringify({ item, result }, null, 2)
      : formatTriageMarkdown(item, result),
  );
  return 0;
}

const isDirectExecution = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectExecution) {
  runCli().then(
    (code) => {
      process.exitCode = code;
    },
    (error: unknown) => {
      console.error(`IssueSieve: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    },
  );
}
