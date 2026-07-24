# IssueSieve

Human-in-the-loop triage and release notes for open-source maintainers.

[中文说明](README.zh-CN.md)

IssueSieve turns GitHub issue or pull-request metadata into a structured, reviewable suggestion: kind, priority, confidence, labels, missing information, maintainer actions, and a respectful reply draft. It can also turn merged pull-request metadata into release notes that preserve contributor attribution.

It is deliberately conservative:

- repository text is treated as untrusted data, not instructions;
- suspected security reports are routed to private review;
- the CLI never changes labels or posts comments;
- the GitHub Action updates one clearly marked comment instead of creating duplicates;
- every result is labeled as an AI-generated suggestion requiring maintainer review.

## Try it without an API key

```bash
npm install
npm run demo
npm run demo -- --format json
npx tsx src/cli.ts release --file examples/sample-release.json --mock
```

The deterministic mock mode exercises parsing, formatting, and safety routing without making a network request.

## Use the OpenAI API

```bash
export OPENAI_API_KEY="your-api-key"
npx tsx src/cli.ts triage --file examples/sample-issue.json
npx tsx src/cli.ts triage --url https://github.com/OWNER/REPO/issues/123
npx tsx src/cli.ts release --file examples/sample-release.json
```

IssueSieve uses the OpenAI Responses API with Structured Outputs. The default model is `gpt-5.6-sol`; set `OPENAI_MODEL` to select another model available to your organization.

For public GitHub URLs, `GITHUB_TOKEN` is optional but avoids low anonymous rate limits. The token is read from the environment and is never included in model input.

## Input formats

Triage accepts a GitHub URL or a JSON file:

```json
{
  "repository": "acme/widgets",
  "number": 42,
  "type": "issue",
  "title": "CLI crashes when the config file is missing",
  "body": "Observed behavior and reproduction details",
  "author": "sample-contributor",
  "labels": ["needs-triage"],
  "url": "https://github.com/acme/widgets/issues/42"
}
```

Release notes accept a release version and an array of merged pull requests. See [`examples/sample-release.json`](examples/sample-release.json).

## GitHub Action

The repository includes a reusable composite action. Commit the generated `dist/` directory, create an `OPENAI_API_KEY` Actions secret, and add this workflow:

```yaml
name: IssueSieve triage

on:
  issues:
    types: [opened, edited, reopened]

permissions:
  contents: read
  issues: write

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          github-token: ${{ github.token }}
          post-comment: "true"
```

Use `post-comment: "false"` to keep results in the workflow summary only. The included [opt-in workflow](.github/workflows/issuesieve.yml) runs only after the repository variable `ISSUESIEVE_ENABLED` is set to `true`.

## Development

Requires Node.js 20 or newer.

```bash
npm install
npm run check
```

The project contains unit tests for URL parsing, GitHub response normalization, schemas, the offline analyzer, Markdown output, and release-note attribution. API calls are intentionally excluded from CI so contributors never need a paid credential to validate a change.

## Project status

IssueSieve is an early MVP. Suggested next milestones are:

- repository-specific label policies and triage rubrics;
- batch triage with cost and token budgets;
- maintainer feedback capture for evaluation;
- release-note collection directly from GitHub compare ranges;
- multilingual contributor replies;
- a benchmark dataset of anonymized, maintainer-reviewed triage decisions.

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and the [launch checklist](docs/LAUNCH_CHECKLIST.md).

## License

[MIT](LICENSE)
