# Agent Preflight

## What data can leave this repo/environment?

Only data explicitly required by the approved task and safe for its intended destination. Never transmit secrets, credentials, private user data, precise location history, local-only files, or unrelated repository content.

## What commands/actions can the agent execute without approval?

Read and search the repository, make scoped local edits, and run non-destructive validation such as tests, lint, audits, and builds. Pushing, opening or merging pull requests, deploying, sending messages, changing remote state, accessing unrelated data, or running destructive commands requires explicit approval.

## What observable result proves this task is done?

The requested artifact or behavior exists in the intended location, the relevant automated checks pass, and the final diff contains only the approved scope. For user-facing behavior, provide a reproducible test or visible result that demonstrates it works.
