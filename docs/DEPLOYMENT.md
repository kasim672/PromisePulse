# Deploy PromisePulse 5.0

**Live website:** https://promise-pulse-rose.vercel.app/  
**Source:** [`kasim672/PromisePulse`](https://github.com/kasim672/PromisePulse) · **production branch:** `main`

PromisePulse 5.0 uses **soft-cyan `#7DD3FC` accents** and is a **static Vite/React application** with DuckDB-Wasm running in the visitor's browser. Python, scikit-learn and the DuckDB desktop package are required to **rebuild data**, but not to **serve the production website**. The GitHub repository already contains the historical exports under `web/public/data/`.

## GitHub source versus live deployment

The official release branch is **`main`**. It contains the original analytics, six mining sections, interactive teaching visualizers, the merged website-wide Gemini assistant and its improved light/dark chatbot styling. Earlier feature branches have been removed; **do not check out deleted `feat/*` or `fix/*` refs**.

Previous Vercel checks reported a **build-rate-limit** failure even when GitHub web validation succeeded. This is not proof that today's production deployment is Ready or on the newest SHA. In the [Vercel project dashboard](https://vercel.com/dashboard) open **Deployments**, inspect the latest production build, and confirm all three: **Ready**, production-domain assignment, and the deployed `main` Git SHA. If the build is blocked by account limits, resolve the limit and redeploy `main`. Do not claim that screenshots or a successful `npm run build` verify the hosted deployment.

### Assistant is merged but Gemini is optional

The `web/api/ask.js` function is part of `main` and can be deployed alongside the Vite frontend. Set `GEMINI_API_KEY` as a **private server-side** environment variable in Vercel Settings; optionally set `GEMINI_MODEL=gemini-3.5-flash` (the code's current default, subject to access by your Google API project). Do not prefix secrets with `VITE_`. Vercel must complete a fresh deployment after environment changes.

On `npm run dev`, a local Node process runs the same handler at **`127.0.0.1:8787`**, with Vite on **`127.0.0.1:5173`** forwarding `/api/ask`. `npm run check:gemini` validates the route without consuming Google credits. Successful route validation does **not** verify Gemini key validity, quota, model access or generated response quality. Gemini may return labelled **reference excerpts** when unavailable.

The knowledge index is rebuilt from checked-in documentation, `manifest.json` and selected mining aggregates on `predev` and `prebuild`. Neither Vercel nor the browser runs the Python ETL or executes chat-requested SQL over raw Parquet files. See [AI architecture and security](GEMINI_RESEARCH_ASSISTANT.md).

## Automation, Vercel build limits and release version (October 30, 2026)

The source release is **PromisePulse 5.0.0**. Both `web/package.json` and `web/package-lock.json` now use `5.0.0`; the application UI and historical data were not changed in this maintenance update.

**GitHub Actions are not the deployment engine.** [Three QA workflows](../.github/ACTIONS_PAUSED.md) can be run manually from GitHub's Actions tab; eleven historical workflows remain archived, including screenshot and branch-cleanup automations. No restored workflow has an automatic `push` or `pull_request` trigger. This avoids unexpected GitHub-hosted runner usage, but means that merging does **not** imply CI passed. Run [Web Validation](../.github/workflows/web-checks.yml) manually and review its result before a release.

**Vercel and GitHub have separate quotas.** The previous Vercel **build-rate-limit** result is not a source file-count diagnostic. At commit `a10c8e36`, the repository contained **251 tracked files**, only **72** of them under `web/`; these counts do not include generated output or uploaded dependencies. Vercel documents a 15,000-source-file limit for **CLI deployments**, but the repository evidence does not show that limit being reached. Inspect the actual Vercel deployment error, build logs, billing and usage limits before deciding on an upgrade or retry.

A checked-in `web/vercel.json` pins **Vite**, `npm ci`, `npm run build`, and `dist`. It cannot change Vercel's account-wide build-rate limits or the dashboard's **Root Directory** setting. Keep the root set to `web`, the production branch set to `main`, and the server-only `GEMINI_API_KEY` stored as a Vercel environment variable.

To limit unnecessary Vercel builds, review **Project Settings → Build and Deployment → Root Directory → Skip deployment** for unaffected code. **Caution:** the production AI evidence index is generated from `README.md` and selected `docs/*.md` files **outside** `web/`. A naive "build only when web changes" rule would skip important documentation updates and make the assistant knowledge stale. If configuring an Ignored Build Step, account for all evidence-index source paths, and remember that a skipped build may still count toward deployment limits. The safest immediate fix for a true rate-limit error is to confirm the quota/refresh window in Vercel and deploy `main` when permitted.

## 1. Deploy to Vercel from GitHub

1. Sign in to [Vercel](https://vercel.com/new) and import `kasim672/PromisePulse`.
2. Choose production branch **`main`**.
3. Set **Root Directory = `web`**. The Node frontend is not at the repository root.
4. Configure the following settings, then deploy:

| Vercel option | Value |
| --- | --- |
| Framework preset | **Vite** |
| Root directory | **`web`** |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | None for static analytics; private `GEMINI_API_KEY` needed for generated AI responses |
| Production branch | `main` |

The repository's [`web/vercel.json`](../web/vercel.json) records the same install/build/output settings. Configure the project root in Vercel itself; `vercel.json` does not set an external project's root directory.

Vercel builds the React application and copies `web/public/` into its output. `index.html`, versioned JavaScript/CSS, `manifest.json`, Parquet files and the mining lab JSON are served as static assets.

**No Python/FastAPI service or hosted SQL database is needed** to serve the historical dashboard. Read-only analytics queries run in browser memory through DuckDB-Wasm. Gemini, unlike the dashboard, depends on a private serverless API function and Google credentials.

## 2. Verify a production deployment

Open **https://promise-pulse-rose.vercel.app/** in a desktop browser and a mobile browser.

- Confirm Welcome loads and displays the actual warehouse totals.
- Open Overview, Intelligence and Analytics Atlas; confirm charts and the historical state map populate.
- Switch between light and dark themes and use the mobile navigation. Verify cyan `#7DD3FC` on active navigation, primary CTAs, the highlighted KPI, selected Brazil state, chart accents, the new favicon and Data Mining Lab controls. The purple wordmark should remain.
- Click the **graduation-cap Data Mining Lab button**; it must open the overview **directly**, without a popup.
- Open Warehouse & ETL, Data Lakes, EDA & Preprocessing, Classification, Clustering and Pattern Mining through the cards and **internal tabs**.
- Inspect the Clustering dendrogram, association rules and CSV exports. Recorded results must come from `mining_lab.json`, not fallback examples.
- Check DevTools → Network for successful requests to `/data/manifest.json`, `/data/fact_orders.parquet`, `/data/mining_lab.json` and the DuckDB `.wasm` file.
- Confirm there are no JavaScript exceptions, broken fonts or horizontal overflow on a narrow phone screen.
- In DevTools Console, run `getComputedStyle(document.documentElement).getPropertyValue('--pp-accent-cyan').trim()`. The deployed soft-cyan release should return `#7DD3FC` (case-insensitive). If the old theme appears, confirm the deployed commit and cached assets before changing source code.

The repository contains two useful checks:
```bash
# Run from the repository root
cd web
npm ci
npm run build

# The manual GitHub Web Validation workflow also runs regression tests in tests/
node ../tests/test_sql_generation.cjs
node ../tests/test_theme.cjs
node ../tests/test_atlas.cjs
node ../tests/test_research_expansion.cjs
node ../tests/test_syllabus_modules.cjs
node ../tests/test_mining_export_integrity.cjs
node ../tests/test_editorial_hierarchy.cjs
node ../tests/test_algorithm_playground.cjs
node ../tests/test_soft_cyan_theme.cjs
node ../tests/test_documentation.cjs
```

The source-backed browser checks in `web/scripts/smoke-soft-cyan.mjs`, `capture-current-docs.mjs` and `smoke-algorithms.mjs` verify the selected cyan states, responsive pages, experimental teaching steps and retry behavior. Playwright is installed separately by CI; it is **not** a permanent frontend dependency. The live smoke workflow can fail when Vercel has not deployed the current commit, even if the local source build passes.

### Verify the optional AI assistant

1. Open **Ask PromisePulse AI** in both light and dark mode and check message readability, focus visibility and mobile layout.
2. Submit a project question (for example, “Which data sources are used?”). Expect documented source links, or a clearly identified reference fallback if Gemini is unavailable.
3. Submit a general question with a configured and quota-enabled Gemini key to verify the generative path. A browser-only greeting is insufficient.
4. Verify `POST /api/ask` reaches a Vercel Function, **not** the Vite SPA's `index.html`. HTTP 404 means the production function may be missing; an upstream model HTTP 404 means a different problem (model access).
5. Confirm credentials are not present in browser Network requests, static bundles, Git or `web/public`. Server logs may indicate authentication/quota errors but must never print the secret.

For local diagnostics, run `npm run check:gemini` from `web`. For production, confirm the correct Vercel deployment, function logs, and server-only variables. Review quotas, firewall/rate-limiting and billing alerts before enabling a public chat endpoint.

## 3. Local development (no source CSV download required)

```bash
git clone https://github.com/kasim672/PromisePulse.git
cd PromisePulse
git switch main
cd web
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. Vite reads the prebuilt assets already checked in under `web/public/data/`. You do not need Kaggle credentials just to explore the dashboard.

To simulate the production bundle:

```bash
npm run build
npm run preview
```

The preview URL is printed by Vite (commonly port 4173).

## 4. Optional: rebuild the historical data

This is only needed to recompute the warehouse/model/lab datasets. Run from the **repository root**:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-export.txt
```

Download the Olist dataset from [Kaggle](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) and place its eight required CSV files in `data/raw/`. The raw source files are intentionally not committed.

```bash
python scripts/build_web_data.py --raw-dir data/raw --train
python scripts/verify_export.py
python scripts/build_mining_lab.py
python scripts/verify_mining_lab.py

cd web
npm ci
npm run build
```

`--train` is optional; it runs the historical chronological model evaluation and exports `risk_predictions.parquet`. Without it, the manifest marks the model as not trained and some held-out model views cannot be populated. The mining lab exporter reads the already exported Parquet files. It does not train a model in the browser.

If the exported files change, inspect `manifest.json` and verify all tests **before** committing the new public assets. The published Olist license is **CC BY-NC-SA 4.0**; confirm proposed use is compatible with its noncommercial and share-alike terms. Application source code itself is under MIT.

## 5. Troubleshooting

| Symptom | What to inspect |
| --- | --- |
| Vercel deploy reports no `package.json` | Set Root Directory to `web` |
| Blank page or asset 404 | Check `npm run build`, build output `dist`, browser console and the public `data` paths |
| Warehouse initialization error | Check `/data/manifest.json` and all Parquet responses; clear cached assets/reload |
| Mining lab says experiment data unavailable | Verify `/data/mining_lab.json` is deployed and `scripts/verify_mining_lab.py` passes |
| Retrying a failed warehouse load | Click **Retry loading data**; the app makes another manifest request and restarts browser initialization. Check the visible phase and `X / Y` registration count. |
| Mining lab JSON temporarily unavailable | Retry on Data Mining Lab overview or an individual lab. No sample values are substituted for measured results. |
| Algorithm step visualizers appear different from empirical plots | Expected: step scenes are illustrative; the charts below use exported Olist experimental results. |

| Slow first load | Browser downloads large WebAssembly binaries and historical Parquet files; first-run performance depends on device/network |
| GitHub merge successful, Vercel shows old lime theme | Deployment is separate from source merging. Inspect latest production deployment SHA, rate limits, and CDN caching before redeploying. |
| Vercel says build rate limited | Check build quota on the project dashboard; retry/redeploy the newest `main` commit after Vercel permits it. |
| Chart not changing | Check filters and denominator/scope; model calibration uses a fixed held-out cohort |
| Custom domain fails | Verify DNS and domain setup in Vercel; canonical documentation URL uses the current `vercel.app` domain |
| Deep URL `/some-page` fails | Current navigation is client-side view state under `/`, not separately configured routes. Do not invent deep links without adding a routing mechanism. |
| Dataset or model numbers appear outdated | The original Olist source is **2016–2018**, and the checked-in export has its own timestamp. This is not a data freshness issue in a live operational system. |

## 6. Security and publishing boundaries

- `web/public/data/` is **public**, including `manifest.json` and Parquet files. Do not publish API keys, password files or private records.
- The frontend validates submitted query strings and only permits a single read-only `SELECT`/`WITH`/`EXPLAIN` query in its wrapper. Do not treat this client-only boundary as a security sandbox for untrusted data.
- No backend account database, write APIs, user login or server-side scheduled ML retraining is included in this release.
- Avoid advertising the dataset as a live feed or the models as production delivery predictions.

The archived historical browser QA in [`v5-algorithm-playground.yml`](../.github/workflows-paused/v5-algorithm-playground.yml) checked five step visualizations in light/dark/mobile and tests transient 503 failures followed by successful retry. Its screenshots and provenance are stored under `docs/screenshots/current/`.

Related documentation: [Design System](THEME_SYSTEM.md) · [Algorithm Playground](ALGORITHM_PLAYGROUND.md) · [Architecture](ARCHITECTURE_V5.md) · [Screenshot gallery](SCREENSHOT_GALLERY_CURRENT.md) · [Research reproducibility](RESEARCH_REPRODUCIBILITY.md).
