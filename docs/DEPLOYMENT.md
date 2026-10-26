# Deploy PromisePulse 5.0

**Live website:** https://promise-pulse-rose.vercel.app/  
**Source:** [`kasim672/PromisePulse`](https://github.com/kasim672/PromisePulse) · **production branch:** `main`

PromisePulse 5.0 uses **soft-cyan `#7DD3FC` accents** and is a **static Vite/React application** with DuckDB-Wasm running in the visitor's browser. Python, scikit-learn and the DuckDB desktop package are required to **rebuild data**, but not to **serve the production website**. The GitHub repository already contains the historical exports under `web/public/data/`.

## Deployment state versus GitHub release

The soft-cyan theme was merged into `main` on **October 26, 2026** in [PR #10](https://github.com/kasim672/PromisePulse/pull/10), merge commit `0ddf3b69a8d33b2a448dca0a31f5eeb2a456a4eb`. Its GitHub web validation succeeded, but the corresponding **Vercel deployment returned “Deployment rate limited — retry in 24 hours.”**

Until Vercel reports a successful deployment for that commit or a newer `main` commit, the public URL might still show the previous lime design. **Do not describe GitHub's successful merge or local screenshots as proof that the live website updated.** This is a deployment-account limit, not a TypeScript compilation failure.

To publish the merged design when the limit clears:

1. Open the [Vercel project dashboard](https://vercel.com/kasim5) and select the PromisePulse project.
2. Open **Deployments** and inspect the deployment associated with the newest `main` commit.
3. If Vercel is still rate-limiting builds, wait until it allows another deployment or review the plan's build allowance.
4. Use **Redeploy** for the latest production commit, if available, or trigger a fresh deployment from `main`.
5. Confirm **Ready**, the production domain assignment, and the displayed Git commit SHA before opening the public site and checking its theme.

The release screenshots in this repository are from Chromium rendering the source application with actual checked-in historical data. They provide UI evidence **even if a Vercel deployment is pending**.

### Optional project-only Gemini assistant

A pending feature branch, `feat/gemini-project-research-assistant`, adds the `/api/ask` Vercel Function to the Vite project root (`web/api/ask.js`). It must be merged and deployed before that endpoint exists in production. This new feature does not change the static Parquet warehouse or existing machine-learning results.

To enable it, set `GEMINI_API_KEY` **privately in Vercel project Environment Variables**, not in Vite source or a `VITE_*` variable. The server defaults to `GEMINI_MODEL=gemini-2.5-flash`; change this server-only variable to an available model when necessary. For local API testing, use `npx vercel dev` from `web`, not only `npm run dev`. Review request quotas, Google billing, Vercel firewall rules and the user-data implications first. See [Gemini Research Assistant](GEMINI_RESEARCH_ASSISTANT.md).

The normal static frontend build remains unchanged. The Gemini feature requires a real Vercel deployment with Functions support; a successful `npm run build` does not by itself test Gemini authentication or confirm the Vercel API route is live.

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
| Environment variables | None required for bundled historical data |
| Production branch | `main` |

Vercel builds the React application and copies `web/public/` into its output. `index.html`, versioned JavaScript/CSS, `manifest.json`, Parquet files and the mining lab JSON are served as static assets.

**Do not configure** a Python/Flask/FastAPI server, a live PostgreSQL/DuckDB service, or an API key just to deploy the current dashboard. All analytical queries run in browser memory through DuckDB-Wasm.

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

# GitHub CI also runs regression tests in tests/
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

The new browser QA in [`v5-algorithm-playground.yml`](../.github/workflows/v5-algorithm-playground.yml) checks five step visualizations in light/dark/mobile and tests transient 503 failures followed by successful retry. Its screenshots and provenance are stored under `docs/screenshots/current/`.

Related documentation: [Design System](THEME_SYSTEM.md) · [Algorithm Playground](ALGORITHM_PLAYGROUND.md) · [Architecture](ARCHITECTURE_V5.md) · [Screenshot gallery](SCREENSHOT_GALLERY_CURRENT.md) · [Research reproducibility](RESEARCH_REPRODUCIBILITY.md).
