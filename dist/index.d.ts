import OpenAI from 'openai';
import { z } from 'zod';

declare const WorkItemSchema: z.ZodObject<{
    repository: z.ZodString;
    number: z.ZodNumber;
    type: z.ZodEnum<{
        issue: "issue";
        pull_request: "pull_request";
    }>;
    title: z.ZodString;
    body: z.ZodString;
    author: z.ZodString;
    labels: z.ZodArray<z.ZodString>;
    url: z.ZodOptional<z.ZodURL>;
}, z.core.$strip>;
declare const TriageResultSchema: z.ZodObject<{
    kind: z.ZodEnum<{
        bug: "bug";
        feature: "feature";
        question: "question";
        documentation: "documentation";
        security: "security";
        maintenance: "maintenance";
        other: "other";
    }>;
    priority: z.ZodEnum<{
        p0: "p0";
        p1: "p1";
        p2: "p2";
        p3: "p3";
    }>;
    confidence: z.ZodNumber;
    summary: z.ZodString;
    suggested_labels: z.ZodArray<z.ZodString>;
    missing_information: z.ZodArray<z.ZodString>;
    maintainer_actions: z.ZodArray<z.ZodString>;
    response_draft: z.ZodString;
    needs_human_attention: z.ZodBoolean;
    attention_reason: z.ZodString;
}, z.core.$strip>;
declare const ReleaseRequestSchema: z.ZodObject<{
    repository: z.ZodString;
    version: z.ZodString;
    previous_version: z.ZodOptional<z.ZodString>;
    pull_requests: z.ZodArray<z.ZodObject<{
        number: z.ZodNumber;
        title: z.ZodString;
        body: z.ZodString;
        author: z.ZodString;
        labels: z.ZodArray<z.ZodString>;
        url: z.ZodOptional<z.ZodURL>;
    }, z.core.$strip>>;
}, z.core.$strip>;
declare const ReleaseNotesSchema: z.ZodObject<{
    version: z.ZodString;
    overview: z.ZodString;
    sections: z.ZodArray<z.ZodObject<{
        heading: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            pull_request: z.ZodNumber;
            title: z.ZodString;
            description: z.ZodString;
            contributor: z.ZodString;
            breaking: z.ZodBoolean;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    upgrade_notes: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
type WorkItem = z.infer<typeof WorkItemSchema>;
type TriageResult = z.infer<typeof TriageResultSchema>;
type ReleaseRequest = z.infer<typeof ReleaseRequestSchema>;
type ReleaseNotes = z.infer<typeof ReleaseNotesSchema>;

interface Analyzer {
    triage(item: WorkItem): Promise<TriageResult>;
    releaseNotes(release: ReleaseRequest): Promise<ReleaseNotes>;
}
interface OpenAIAnalyzerOptions {
    apiKey?: string;
    model?: string;
    client?: OpenAI;
}
declare class OpenAIAnalyzer implements Analyzer {
    private readonly client;
    private readonly model;
    constructor(options?: OpenAIAnalyzerOptions);
    triage(rawItem: WorkItem): Promise<TriageResult>;
    releaseNotes(rawRelease: ReleaseRequest): Promise<ReleaseNotes>;
}

declare const COMMENT_MARKER = "<!-- issuesieve:triage -->";
declare function formatTriageMarkdown(item: WorkItem, result: TriageResult): string;
declare function formatReleaseNotesMarkdown(release: ReleaseRequest, notes: ReleaseNotes): string;

interface GitHubIssueReference {
    owner: string;
    repo: string;
    number: number;
}
declare function parseGitHubIssueUrl(value: string): GitHubIssueReference;
declare function fetchGitHubWorkItem(value: string, token?: string | undefined, fetcher?: typeof fetch): Promise<WorkItem>;

declare class MockAnalyzer implements Analyzer {
    triage(item: WorkItem): Promise<TriageResult>;
    releaseNotes(release: ReleaseRequest): Promise<ReleaseNotes>;
}

export { type Analyzer, COMMENT_MARKER, MockAnalyzer, OpenAIAnalyzer, type OpenAIAnalyzerOptions, type ReleaseNotes, ReleaseNotesSchema, type ReleaseRequest, ReleaseRequestSchema, type TriageResult, TriageResultSchema, type WorkItem, WorkItemSchema, fetchGitHubWorkItem, formatReleaseNotesMarkdown, formatTriageMarkdown, parseGitHubIssueUrl };
