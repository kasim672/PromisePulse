# PromisePulse 5.0 — verified application screenshots

The linked page and algorithm screenshots below are **genuine Playwright Chromium captures**, using the checked-in Olist Parquet warehouse and mining export. Their currently checked-in manifests record capture commit **`a9620fa` on October 26, 2026**. They are valid evidence of that version, **not yet proof that later Gemini/chat theme edits or the public Vercel deployment are pictured**. This gallery distinguishes source provenance from deployment status and does not substitute generated mockups or fictitious metrics.

The reproducible scripts are [`capture-current-docs.mjs`](../web/scripts/capture-current-docs.mjs), [`smoke-algorithms.mjs`](../web/scripts/smoke-algorithms.mjs), and [`capture-assistant-docs.mjs`](../web/scripts/capture-assistant-docs.mjs) for the now-integrated AI drawer. The [page capture manifest](screenshots/current/CAPTURE_MANIFEST.json) and [algorithm capture manifest](screenshots/current/ALGORITHM_CAPTURE_MANIFEST.json) record the source commit, date, viewport, and image filenames. Use the [design system](THEME_SYSTEM.md) for palette and contrast specifications.

## Landing and original analytics

| Welcome / landing | Dashboard Overview |
| --- | --- |
| [![PromisePulse Welcome, light theme](screenshots/current/welcome-light.png)](screenshots/current/welcome-light.png) | [![PromisePulse Overview, light theme](screenshots/current/overview-light.png)](screenshots/current/overview-light.png) |

[![Analytics Atlas showing historical interactive figures](screenshots/current/analytics-atlas-light.png)](screenshots/current/analytics-atlas-light.png)

The Overview retains the historical state-level map. This is **not** a live courier or GPS tracking screen.

## Data Mining Lab and experimentally verified figures

| Lab overview | Warehouse & ETL |
| --- | --- |
| [![Data Mining Lab overview](screenshots/current/mining-hub-light.png)](screenshots/current/mining-hub-light.png) | [![Warehouse and ETL analysis](screenshots/current/warehouse-etl-light.png)](screenshots/current/warehouse-etl-light.png) |

| Clustering and dendrogram | Apriori / FP-Growth / Eclat |
| --- | --- |
| [![Clustering Lab with real dendrogram linkage](screenshots/current/clustering-light.png)](screenshots/current/clustering-light.png) | [![Pattern mining with real published association rules](screenshots/current/pattern-mining-light.png)](screenshots/current/pattern-mining-light.png) |

The lab overview opens from the graduation-cap icon **without a popup**. Its six analysis sections use overview cards and internal tabs. The teaching hour breakdown is kept in the [course documentation](SYLLABUS_V5.md), not displayed as tiny banners on the website.

## New step-by-step algorithm visualizations

The five methods below use **computed, explicitly illustrative inputs**. They are browser screenshots of the working visualizer, not images fabricated by a graphics tool. The actual Olist experiment figures remain on the same pages below the teaching scenes.

| K-Means calculated centroid updates | Decision Tree sample path |
| --- | --- |
| [![K-Means example visualizer](screenshots/current/algorithm-k-means-light.png)](screenshots/current/algorithm-k-means-light.png) | [![Decision Tree example visualizer](screenshots/current/algorithm-decision-tree-light.png)](screenshots/current/algorithm-decision-tree-light.png) |

| Apriori candidate counting | FP-Growth prefix counts | Eclat TID intersections |
| --- | --- | --- |
| [![Apriori example](screenshots/current/algorithm-apriori-light.png)](screenshots/current/algorithm-apriori-light.png) | [![FP-Growth example](screenshots/current/algorithm-fp-growth-light.png)](screenshots/current/algorithm-fp-growth-light.png) | [![Eclat example](screenshots/current/algorithm-eclat-light.png)](screenshots/current/algorithm-eclat-light.png) |

[Dark mode visualizer capture](screenshots/current/algorithm-k-means-dark.png) · [Mobile visualizer capture](screenshots/current/mobile-algorithm-k-means-light.png) · [Algorithm screenshot provenance](screenshots/current/ALGORITHM_CAPTURE_MANIFEST.json).

These scenes use **six sample points for K-Means** and **five small baskets for pattern mining**. Actual scientific results come from Olist's exported experiments. See [the worked algorithm guide](ALGORITHM_PLAYGROUND.md) for formulas, sample inputs and limitations.

## Chatbot appearance in the current source

The integrated **Ask PromisePulse AI** drawer uses an opaque white/pale-blue message surface in light mode and a preserved dark graphite theme in dark mode. Its source-backed answer mode displays related project links when documentation evidence is available. The renderer has no knowledge of the user's active SQL workspace or live delivery data.

The [assistant capture script](../web/scripts/capture-assistant-docs.mjs) records three **intro** surfaces (desktop light, desktop dark, mobile light) and two **documentation-answer** surfaces (desktop light/dark) against the real local server, without secret API keys. Captures appear with `ASSISTANT_CAPTURE_MANIFEST.json` once the automated capture job publishes them. Until then, the page and algorithm images above retain their original capture provenance.

## Dark mode and mobile

| Dark Welcome | Dark Data Mining Lab |
| --- | --- |
| [![Welcome dark theme](screenshots/current/welcome-dark.png)](screenshots/current/welcome-dark.png) | [![Mining hub dark theme](screenshots/current/mining-hub-dark.png)](screenshots/current/mining-hub-dark.png) |

| Mobile Welcome | Mobile Overview | Mobile Mining Hub |
| --- | --- | --- |
| [![Mobile landing](screenshots/current/mobile-welcome-light.png)](screenshots/current/mobile-welcome-light.png) | [![Mobile Overview](screenshots/current/mobile-overview-light.png)](screenshots/current/mobile-overview-light.png) | [![Mobile lab overview](screenshots/current/mobile-mining-hub-light.png)](screenshots/current/mobile-mining-hub-light.png) |

The original page and algorithm captures predate the later **website-wide Gemini assistant, loopback API routing fix, and improved light-mode chat styling**. The current application also has an actual floating chatbot drawer, an optional server-side Gemini endpoint, and transparent non-generative reference fallbacks. The [architecture guide](ARCHITECTURE_V5.md) documents these. After an approved documentation merge, the [current-release capture workflow](../.github/workflows/current-docs-capture.yml) can render and publish refreshed page, algorithm and chatbot screenshots with matching Git SHAs. **A source screenshot is not evidence of Vercel production readiness**.

Screenshots are evidence of actual rendering, **not independent validation of model accuracy or causal claims**. The dataset is historical. The classification results are weak, cluster fit uses bounded samples, and pattern mining uses a selected basket population.

### Refresh captures after future visual changes

Run the current screenshot script in the web directory once the development server is running on port 4173:

```bash
cd web
npm ci
npm install --no-save --package-lock=false playwright
npx playwright install chromium
npm run dev -- --host 127.0.0.1 --port 4173
# In a second terminal:
PP_BASE_URL=http://127.0.0.1:4173 node scripts/capture-current-docs.mjs
PP_BASE_URL=http://127.0.0.1:4173 node scripts/smoke-algorithms.mjs
PP_BASE_URL=http://127.0.0.1:4173 node scripts/capture-assistant-docs.mjs
```

The scripts write **13 page screenshots**, **15 teaching-method screenshots** and **five AI drawer screenshots** with separate provenance manifests to `docs/screenshots/current/`. The chatbot capture uses the actual React UI and local HTTP handler; it does not call Google or invent Gemini answers. The workflow only publishes files after validating capture counts, sources and matching Git SHAs. If the latest capture job has not completed, continue using the recorded older screenshots as historical evidence rather than describing them as the newest UI.

### Archived galleries

Earlier screenshots remain available as historical release records. Some contain UI copy that has since been removed; **do not use them as the primary images for the current release**.

- [Original dashboards and Analytics Atlas (V3)](SCREENSHOT_GALLERY.md)
- [Research expansion and Welcome (V4)](SCREENSHOT_GALLERY_V4.md)
- [Six mining-lab sections, before final editorial refinements (V5)](SCREENSHOT_GALLERY_V5.md)
