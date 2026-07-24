import { z } from "zod";

export const WorkItemTypeSchema = z.enum(["issue", "pull_request"]);

export const WorkItemSchema = z.object({
  repository: z.string().min(1),
  number: z.number().int().positive(),
  type: WorkItemTypeSchema,
  title: z.string().min(1),
  body: z.string(),
  author: z.string().min(1),
  labels: z.array(z.string()),
  url: z.url().optional(),
});

export const TriageResultSchema = z.object({
  kind: z.enum([
    "bug",
    "feature",
    "question",
    "documentation",
    "security",
    "maintenance",
    "other",
  ]),
  priority: z.enum(["p0", "p1", "p2", "p3"]),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
  suggested_labels: z.array(z.string()).max(8),
  missing_information: z.array(z.string()).max(8),
  maintainer_actions: z.array(z.string()).min(1).max(8),
  response_draft: z.string().min(1),
  needs_human_attention: z.boolean(),
  attention_reason: z.string(),
});

export const ReleasedPullRequestSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  body: z.string(),
  author: z.string().min(1),
  labels: z.array(z.string()),
  url: z.url().optional(),
});

export const ReleaseRequestSchema = z.object({
  repository: z.string().min(1),
  version: z.string().min(1),
  previous_version: z.string().min(1).optional(),
  pull_requests: z.array(ReleasedPullRequestSchema).min(1).max(200),
});

export const ReleaseNotesSchema = z.object({
  version: z.string().min(1),
  overview: z.string().min(1),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1),
        items: z
          .array(
            z.object({
              pull_request: z.number().int().positive(),
              title: z.string().min(1),
              description: z.string().min(1),
              contributor: z.string().min(1),
              breaking: z.boolean(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
  upgrade_notes: z.array(z.string()),
});

export type WorkItem = z.infer<typeof WorkItemSchema>;
export type TriageResult = z.infer<typeof TriageResultSchema>;
export type ReleaseRequest = z.infer<typeof ReleaseRequestSchema>;
export type ReleaseNotes = z.infer<typeof ReleaseNotesSchema>;
