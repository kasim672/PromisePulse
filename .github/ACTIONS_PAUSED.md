# GitHub Actions temporarily paused — October 27, 2026

All 14 original GitHub Actions YAML workflows were moved from `.github/workflows/` to `.github/workflows-paused/` without editing their contents. GitHub only discovers workflow definitions inside `.github/workflows/`; this prevents **new automatic GitHub Actions runs**, including test, browser screenshot, and branch-cleanup automation.

## Why this is paused
The project owner wants to preserve GitHub Actions quota and focus on Vercel deployment until next month. No application code, historical datasets, existing screenshots or Vercel settings were changed. Vercel's native GitHub integration can still deploy commits on `main`; this repo does not require GitHub Actions for production builds.

## Restore after November begins
```sh
git switch main
git pull --ff-only origin main
mkdir -p .github/workflows
git mv .github/workflows-paused/*.yml .github/workflows/
git commit -m "ci: restore GitHub Actions workflows"
git push origin main
```

Verify your GitHub Actions included allowance and billing settings before restoring, because running the workflows may consume GitHub-hosted runner minutes. The $0 budget and blocked-usage UI alone do not prove the included allowance is exhausted.

**Note:** Previously queued or running Actions jobs may continue; moving YAML files prevents new runs. Vercel deployment itself has separate quota and build-limit settings.
