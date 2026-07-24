# Contributing to IssueSieve

Thanks for helping reduce open-source maintenance load.

## Before opening a change

- Use an issue for significant features or behavior changes.
- Keep AI decisions reviewable and reversible.
- Do not add autonomous label changes, issue closure, or public security analysis without an explicit approval design.
- Never add real API keys, tokens, private issue content, or model responses containing personal data to fixtures.

## Local checks

```bash
npm install
npm run check
```

Tests must run without network access and without paid credentials. Add a deterministic fixture or mock for new model-assisted flows.

## Pull requests

Explain the maintainer problem, the behavioral change, its safety implications, and how it was verified. Prefer small pull requests that can be reviewed independently.
