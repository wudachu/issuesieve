import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import {
  buildReleasePrompt,
  buildTriagePrompt,
  RELEASE_SYSTEM_PROMPT,
  TRIAGE_SYSTEM_PROMPT,
} from "./prompt.js";
import {
  ReleaseNotesSchema,
  ReleaseRequestSchema,
  TriageResultSchema,
  WorkItemSchema,
  type ReleaseNotes,
  type ReleaseRequest,
  type TriageResult,
  type WorkItem,
} from "./schema.js";

export interface Analyzer {
  triage(item: WorkItem): Promise<TriageResult>;
  releaseNotes(release: ReleaseRequest): Promise<ReleaseNotes>;
}

export interface OpenAIAnalyzerOptions {
  apiKey?: string;
  model?: string;
  client?: OpenAI;
}

export class OpenAIAnalyzer implements Analyzer {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: OpenAIAnalyzerOptions = {}) {
    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    if (!options.client && !apiKey) {
      throw new Error(
        "OPENAI_API_KEY is required. Set it in the environment or use --mock for an offline demo.",
      );
    }

    this.client = options.client ?? new OpenAI({ apiKey });
    this.model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.6-sol";
  }

  async triage(rawItem: WorkItem): Promise<TriageResult> {
    const item = WorkItemSchema.parse(rawItem);
    const response = await this.client.responses.parse({
      model: this.model,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: TRIAGE_SYSTEM_PROMPT },
        { role: "user", content: buildTriagePrompt(item) },
      ],
      text: {
        format: zodTextFormat(TriageResultSchema, "issue_triage"),
        verbosity: "low",
      },
    });

    if (!response.output_parsed) {
      throw new Error("OpenAI returned no structured triage result.");
    }

    return TriageResultSchema.parse(response.output_parsed);
  }

  async releaseNotes(rawRelease: ReleaseRequest): Promise<ReleaseNotes> {
    const release = ReleaseRequestSchema.parse(rawRelease);
    const response = await this.client.responses.parse({
      model: this.model,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: RELEASE_SYSTEM_PROMPT },
        { role: "user", content: buildReleasePrompt(release) },
      ],
      text: {
        format: zodTextFormat(ReleaseNotesSchema, "release_notes"),
        verbosity: "low",
      },
    });

    if (!response.output_parsed) {
      throw new Error("OpenAI returned no structured release notes.");
    }

    return ReleaseNotesSchema.parse(response.output_parsed);
  }
}
