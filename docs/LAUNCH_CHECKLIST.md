# Public launch checklist

A public repository is the start of an open-source project, not evidence of adoption by itself.

## Before the first release

- Replace placeholder ownership and contact text with your real GitHub identity.
- Confirm that `issuesieve` and the repository name are available where you plan to publish.
- Review the MIT license and choose a different license if needed.
- Run `npm run check` on a clean checkout.
- Inspect the generated `dist/action.js`; it must be committed for the composite action to work.
- Create a GitHub repository, enable Issues and private vulnerability reporting, and push the full history.
- Create an `OPENAI_API_KEY` Actions secret only if you will enable live triage.
- Keep `ISSUESIEVE_ENABLED` unset until the secret and spending limits are ready.

## Build credible maintenance evidence

- Publish `v0.1.0` with release notes and a short terminal recording.
- Open roadmap issues instead of landing every idea in the initial commit.
- Ask 3–5 real maintainers to try the offline demo or dry-run workflow.
- Record feedback as public issues, including rejected ideas and safety concerns.
- Respond to issues, review pull requests, and publish follow-up releases.
- Track useful signals honestly: installations, repositories using the action, reviewed triage suggestions, acceptance/correction rate, and maintainer time saved.

Do not buy stars, fabricate downloads, backdate commits, or describe mock output as production usage.

## Application readiness

Before applying for open-source support, be ready to explain:

- why IssueSieve matters to the software ecosystem;
- your primary or core maintainer role;
- evidence that the project is active and useful;
- the exact maintainer workflows API credits would support;
- how human review, privacy, security reports, and cost limits are handled.
