# GitHub Actions status — October 30, 2026

On October 27, 2026, all 14 original workflows were moved from `.github/workflows/` to `.github/workflows-paused/` to avoid further automatic GitHub Actions usage. The historical pause commit was `a10c8e36f770ec4eca76d26ea3ee2ca5a61a966e`.

## Manual checks restored

The following workflows are available under `.github/workflows/`. Each has **only** a `workflow_dispatch` trigger, so it runs only when explicitly launched from the Actions tab on the default branch (or via the GitHub API). None automatically executes on pushes or pull requests:

- `web-checks.yml` — build and repository regression tests.
- `gemini-assistant.yml` — browser/API integration QA using a key-free local test environment; no real Gemini API request required.
- `live-editorial-smoke.yml` — optional browser check against the currently published Vercel site, **not** the unmerged branch.

## Eleven workflows remain archived

Legacy screenshot captures, retired feature-branch checks, data export triggers and `cleanup-feature-branches.yml` remain under `.github/workflows-paused/`. Several are tied to deleted branches or perform `git push` and should not be restored unchanged. They are retained as original reference YAML, not lost.

To manually run the core checks after merging the restoration to `main`: **GitHub → Actions → PromisePulse Web Validation → Run workflow → main**. Inspect the logs before publishing. Running workflows consumes GitHub-hosted runner minutes and may be blocked by account quotas; restoring the YAML does not reset those quotas.

## Vercel is independent

Vercel's native GitHub integration builds `main` separately from these Actions workflows. The current [deployment guide](../docs/DEPLOYMENT.md) and `web/vercel.json` document the Vite configuration. They do not reset Vercel build-rate limits or alter project settings in the Vercel dashboard.

The source-only maintenance change does not claim that production has deployed successfully. Check that Vercel shows the expected `main` commit SHA and a **Ready** deployment before announcing a release. Restore a legacy workflow only after verifying its branch, triggers, quota impact and write permissions.
