# Deploy PromisePulse 5.0

**Live website:** https://promise-pulse-rose.vercel.app/  
**Source:** [`kasim672/PromisePulse`](https://github.com/kasim672/PromisePulse) · **production branch:** `main`

PromisePulse 5.0 is a **static Vite/React application** with DuckDB-Wasm running in the visitor's browser. Python, scikit-learn and the DuckDB desktop package are required to **rebuild data**, but not to **serve the production website**. The GitHub repository already contains the historical exports under `web/public/data/`.

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
- Switch between light and dark themes and use the mobile navigation.
- Click the **graduation-cap Data Mining Lab button**; it must open the overview **directly**, without a popup.
- Open Warehouse & ETL, Data Lakes, EDA & Preprocessing, Classification, Clustering and Pattern Mining through the cards and **internal tabs**.
- Inspect the Clustering dendrogram, association rules and CSV exports. Recorded results must come from `mining_lab.json`, not fallback examples.
- Check DevTools → Network for successful requests to `/data/manifest.json`, `/data/fact_orders.parquet`, `/data/mining_lab.json` and the DuckDB `.wasm` file.
- Confirm there are no JavaScript exceptions, broken fonts or horizontal overflow on a narrow phone screen.

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
```

The browser test in `web/scripts/smoke-live-editorial.mjs` additionally checks desktop/mobile light/dark navigation, and is run by [the live UI GitHub workflow](../.github/workflows/live-editorial-smoke.yml). Playwright is installed separately by the workflow; it is **not** a permanent frontend dependency.

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
| Slow first load | Browser downloads large WebAssembly binaries and historical Parquet files; first-run performance depends on device/network |
| Chart not changing | Check filters and denominator/scope; model calibration uses a fixed held-out cohort |
| Custom domain fails | Verify DNS and domain setup in Vercel; canonical documentation URL uses the current `vercel.app` domain |
| Deep URL `/some-page` fails | Current navigation is client-side view state under `/`, not separately configured routes. Do not invent deep links without adding a routing mechanism. |
| Dataset or model numbers appear outdated | The original Olist source is **2016–2018**, and the checked-in export has its own timestamp. This is not a data freshness issue in a live operational system. |

## 6. Security and publishing boundaries

- `web/public/data/` is **public**, including `manifest.json` and Parquet files. Do not publish API keys, password files or private records.
- The frontend validates submitted query strings and only permits a single read-only `SELECT`/`WITH`/`EXPLAIN` query in its wrapper. Do not treat this client-only boundary as a security sandbox for untrusted data.
- No backend account database, write APIs, user login or server-side scheduled ML retraining is included in this release.
- Avoid advertising the dataset as a live feed or the models as production delivery predictions.

Related documentation: [Architecture](ARCHITECTURE_V5.md) · [Screenshot gallery](SCREENSHOT_GALLERY_CURRENT.md) · [Research reproducibility](RESEARCH_REPRODUCIBILITY.md).
