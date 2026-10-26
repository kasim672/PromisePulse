# PromisePulse 5.0 — deployment and operations

**Repository:** [kasim672/PromisePulse](https://github.com/kasim672/PromisePulse) · **production branch:** `main` · **intended domain:** [promise-pulse-rose.vercel.app](https://promise-pulse-rose.vercel.app/)

This document matches the checked-in Vite/React, DuckDB-Wasm and server-side Gemini assistant implementation. Two independent services are involved: **public static warehouse/website assets** and the **optional `/api/ask` Vercel Function**. No hosted Python process or SQL database is required for visitors.

## 1. Release status: source versus deployment

A passing GitHub build confirms the current source compiles and its automated tests pass. It **does not** establish that a newer `main` commit has reached the public Vercel domain. On **October 26, 2026**, Vercel reported a **deployment-rate-limit** problem during earlier builds. Its continuing state must be checked in Vercel; do not assume a specific commit is live based only on GitHub merges, a badge, or screenshots. This guide documents the current source, not a separately confirmed live deployment.

To verify: open the project's **Vercel → Deployments**, identify the newest **production** build, check **Ready**, verify the Git commit SHA and production domain assignment, then test the browser and `/api/ask`. If the account remains rate-limited, resume after the limit clears or review plan limits and then redeploy the intended `main` commit. A rate limit is not evidence of a TypeScript or SQL failure.

## 2. Vercel configuration

Import the GitHub repository into [Vercel](https://vercel.com/new). Use these settings:

| Option | Value |
| --- | --- |
| Framework | **Vite** |
| Git repository | `kasim672/PromisePulse` |
| Production branch | **`main`** |
| **Root directory** | **`web`** |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Runtime for optional chatbot | Vercel Function at `web/api/ask.js` |
| Static dashboard secrets | None needed |
| Optional server-only AI secrets | `GEMINI_API_KEY`, `GEMINI_MODEL` |

The build runs `prebuild` to refresh `web/api/_site-index.mjs` from the checked-in technical docs and public aggregate JSON, runs TypeScript checks and emits `dist/`. Vite copies `web/public/data/` to the static output. The separately deployed `web/api/ask.js` answers chat requests in a serverless runtime. It is not part of the client JavaScript bundle.

**Do not** deploy Flask, FastAPI, PostgreSQL, a live DuckDB server, recurring model training or Streamlit. Python and DuckDB CLI libraries only rebuild the offline research artifacts.

### Server-side Gemini setup

The chat drawer is already on `main`. For **Gemini-generated explanations**, obtain an API key from [Google AI Studio](https://aistudio.google.com/apikey) and set `GEMINI_API_KEY` in **Vercel Project Settings → Environment Variables** for the intended environment(s). Do **not** prefix it with `VITE_` or paste it into GitHub, HTML, `web/public` or issue comments.

`GEMINI_MODEL` is optional. At the time of this source revision, `web/api/ask.js` defaults to `gemini-3.5-flash`; **actual model availability is specific to your Google API project and can change**. Use a model ID supported by your key, then redeploy. A Gemini HTTP 404 can mean an unavailable model, while a **website** `/api/ask` HTTP 404 usually means the endpoint was not deployed/proxied at all. These are different issues.

If the private key is absent or Gemini is unavailable, the assistant may still show *clearly labeled reference excerpts* from website documentation. This fallback is **not** a successful Gemini-generated answer. Configure Google quotas/alerts and Vercel bot protection or rate limits for public traffic; the backend's in-memory rate limit is best-effort only.

[Full chatbot architecture, privacy, fallback behavior and limitations](GEMINI_RESEARCH_ASSISTANT.md).

## 3. Local development on Linux/macOS

Prerequisites: Node.js 22 (matching CI) and npm. The checked-in static data lets the analytics website run without raw CSVs, Python, Kaggle authentication or a Gemini key.

```bash
git clone https://github.com/kasim672/PromisePulse.git
cd PromisePulse
git switch main
cd web
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. `npm run dev` runs `predev` to refresh the assistant index, then starts `scripts/dev.mjs`, which launches the Node AI API on **127.0.0.1:8787** and Vite on **127.0.0.1:5173**. Vite uses **`vite.config.ts` explicitly** and forwards `/api/ask` to loopback. Both ports must be free; stop stale Vite or API processes instead of silently changing URLs.

The checked-in example `web/.env.example` contains empty/illustrative settings. Initialize the private file only if you want Gemini:

```bash
cd web
npm run setup:gemini
# Edit web/.env and set GEMINI_API_KEY privately.
# Optionally set GEMINI_MODEL to a valid model for your API key.
npm run dev
```

In a second terminal:

```bash
cd web
npm run check:gemini
```

A **PASS** from `check:gemini` confirms the **local HTTP route** is present: it submits an intentionally invalid short question and uses **no Google API credits**. Afterward, manually ask the UI about the dataset to validate the actual key, quota and Google response.

For production static-build inspection:

```bash
cd web
npm run build
npm run preview
```

The Vite preview serves static assets; **do not assume it reproduces a deployed Vercel serverless Function**. Test the AI route using `npm run dev` or the deployed `/api/ask`.

## 4. Production verification checklist

1. Confirm Vercel's production build is **Ready**, is assigned to the intended domain and matches the `main` Git SHA being tested.
2. Check Welcome and Overview load the actual historical warehouse. Network responses to `/data/manifest.json`, `/data/fact_orders.parquet`, `/data/mining_lab.json`, browser WebAssembly assets and application JS should succeed.
3. Check Analytics Atlas, customer cohorts, OLAP, the Brazil historical state map, Risk Center and mining lab figures. Do not mistake illustrative teaching animations for trained-model output.
4. Open the graduation-cap icon: it should enter the six-section mining hub directly. Check tab/card navigation and failure/retry states.
5. Compare dark and light themes, keyboard focus and mobile layout. The cyan theme token is `#7DD3FC`; the chatbot's **light theme has white/pale-blue surfaces** while the existing dark chat palette is preserved.
6. Click **Ask PromisePulse AI**. Confirm `POST /api/ask` is not a frontend 404. Without a key, validate the explicitly labeled **reference** fallback. With a key, ask about the Olist dataset, verify a generated explanation, and try a general question. Validate citations for project-specific claims.
7. Verify no API key appears in HTML, client JS, `VITE_*` variables or browser network requests to your own site. The server alone calls Google with the key. Inspect quota and firewall protection separately.
8. Recheck without browser-cache interference if the live interface differs from the [source-backed screenshot gallery](SCREENSHOT_GALLERY_CURRENT.md).

To test API routing without using Gemini credits, a POST with a short invalid question should return **HTTP 400**, not 404:

```bash
curl -i -X POST https://promise-pulse-rose.vercel.app/api/ask \
  -H 'Content-Type: application/json' \
  -d '{"question":"hi"}'
```

Run this against your **actual Ready production deployment**. A pass demonstrates the function route, not Gemini authentication.

## 5. Build and data verification

From `web/`:

```bash
npm ci
npm run build
node ../tests/test_documentation.cjs
node ../tests/test_theme.cjs
node ../tests/test_soft_cyan_theme.cjs
node ../tests/test_gemini_assistant.mjs
node ../tests/test_mining_export_integrity.cjs
```

See [`.github/workflows/web-checks.yml`](../.github/workflows/web-checks.yml) for all required tests. Playwright Chromium is installed separately in browser-validation workflows rather than as a permanent web runtime dependency. Authentic screenshots and their source commit are tracked in [`docs/screenshots/current/`](screenshots/current/).

### Optional: rebuild the historical exports

This is an **offline reproducibility operation**, not required to serve the bundled dataset. Download the eight Olist CSVs from [Kaggle](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) and place them in `data/raw/`, then from the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-export.txt
python scripts/build_web_data.py --raw-dir data/raw --train
python scripts/verify_export.py
python scripts/build_mining_lab.py
python scripts/verify_mining_lab.py
```

With `--train`, the exporter evaluates retrospective chronological delivery risk and produces `risk_predictions.parquet`; without it, model-dependent views may be unavailable. The mining lab exporter reads the published warehouse. Verify and review generated changes before committing them.

## 6. Troubleshooting

| Symptom | Where to inspect | Action |
| --- | --- | --- |
| GitHub merged, old UI on live URL | Vercel Deployments / Git SHA / Ready status | Verify the actual production deployment; investigate rate limit or cache before editing code |
| Assistant greeting works, other prompts return 404 | Network `/api/ask`, Vite config or Vercel Function | Run `npm run check:gemini` locally; ensure `npm run dev` starts both servers; deploy `web/api/ask.js` on Vercel |
| Gemini reference notice instead of generated answer | Private server `.env` / Vercel Environment Variables, model, quota | Check key presence, Google model access and quota; restart or redeploy after changing settings |
| HTTP 429 in chat | Local/Vercel throttling or Google quota | Check rate limits and Google usage; do not disable safety limits for public traffic |
| Loading warehouse never finishes | Browser Network and Console, static Parquet/manifest files | Confirm complete `web/public/data` export; retry or regenerate verified files |
| Mining lab unavailable | `/data/mining_lab.json` | Verify file exists and export/integrity checks passed |
| Colors or chat bubbles unreadable | Saved `promisepulse-theme` setting / CSS bundle | Confirm latest deployed Git SHA and `project-assistant.css` is loaded |

## 7. Security and evidence

- **All** `web/public/data/` assets are publicly downloadable. Do not publish private information or credentials there.
- The browser SQL wrapper is client-side and not a security isolation boundary for malicious data.
- The Gemini API sees visitors' questions and selected website passages when enabled; don't describe conversations as remaining solely inside the browser.
- Historical metrics and current build/deployment statuses must not be conflated. A screenshot demonstrates a specific captured source revision, **not** a service-level health guarantee.
- Olist's dataset license is **CC BY-NC-SA 4.0**; PromisePulse source code is **MIT**. Check the individual usage requirements before republishing derived data.

Related: [architecture](ARCHITECTURE_V5.md) · [assistant](GEMINI_RESEARCH_ASSISTANT.md) · [screenshots](SCREENSHOT_GALLERY_CURRENT.md) · [reproducibility](RESEARCH_REPRODUCIBILITY.md).
