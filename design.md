# PromisePulse 3 — Measured Glass Design Reference

## Reference and provenance

Reference page: https://demo.codeandchill.store/cadra/#/dashboard

Capture: 298 rendered elements, 1920 × 858px, single page/state. This is **computed-style observation**, not original Cadra source code, a style license, an accessibility audit, or evidence of other interaction states. One stylesheet could not be inspected. Colors, sizes, and shadows below are documented observations; layout behavior outside this state is a deliberate PromisePulse design decision.

We implement an **original** Olist e-commerce intelligence application using the measured *design language*, not Cadra's assets, proprietary markup, sample factory data, or workflows.

## Design tokens from the provided measured capture

| Purpose | Observed CSS value |
| --- | --- |
| App background | `#efefec` |
| Raised surface | `#f8f8f6` |
| Primary text, dock | `#111111` |
| Text on dock | `#f7f7f5` |
| Muted text | `#5c5c5a` |
| Faint text | `#73736f` |
| Primary accent | `#bcd4f2` |
| Primary accent text | `#1d4f87` |
| Glass surface | `rgba(255,255,255,.56)` |
| More opaque glass | `rgba(255,255,255,.7)` |
| Highlight rim | `rgba(255,255,255,.8)` |
| Hairline border | `rgba(17,17,17,.09)` |
| Strong border | `rgba(17,17,17,.16)` |
| Card radius | `24px` |
| Control radius | `999px` |
| Shadow | `0 1px 0 rgba(255,255,255,.7) inset, 0 24px 48px -30px rgba(0,0,0,.22)` |
| Motion easing | `cubic-bezier(.2,.8,.2,1)` |
| Max app width | `1840px` |
| Dock width | `60px` |

### Typeface

Urbanist / ui-sans-serif / system UI. Captured heading 38px / 600 / 39.52px / -0.95px; section 15px / 600 / 21.75px; body 13.5px / 500 / 19.575px; buttons 14px / 500 / 20.3px.

### Captured spacing observations

Most common spacing values were 10px, 18px, 8px and 4px. Common CSS gaps were 12px and 10px; 24px rounded cards and fully round controls dominated.

### Responsive hints

The capture found responsive queries at widths 1279, 1099, 900, 860, 760, 480 and 374px; it did **not** establish exact responsive compositions or user interactions. Our implementation adapts a fixed dark icon dock to a mobile bottom icon dock at <= 1099px. This is *our* behavior, not a verified Cadra reproduction.

## PromisePulse 3 layout recipe

- Canvas is warm gray with soft, low-contrast atmospheric gradients; no dark, busy analytics background.
- Left vertical black icon dock on desktop; glass top status/brand bar; bottom dock on small widths.
- Global content grid is fluid, with max available width, and 16px between dashboard blocks.
- First KPI has dark emphasis; other metrics sit on glass. Number values use tabular figures and must wrap rather than overlap.
- Keep the **real** state-level Brazilian choropleth, sourced from historical Olist order facts. No live positions, routes, or invented shipment tracking.
- Chart colors are adjusted to suit the measured light palette while keeping accessible distinctions and PromisePulse brand recognition.
- Every page (Overview, Intelligence, OLAP Lab, Risk Center, Data Catalog, Pipeline & Quality) shares the same shell, surfaces, filter controls and table styles.
- Background blur is limited to utility navigation. The captured cards themselves had no backdrop blur; their glass look comes from translucent fills, white rims and the measured shadow.
- Honor keyboard focus, text contrast, errors/loading states and `prefers-reduced-motion`.

## Implementation and safety constraints

Keep React, TypeScript, Vite, DuckDB-Wasm, Olist Parquet exports, historical SQL filters, all real numeric results, CSV downloads, lineage and ML evaluation intact. Don't surface raw SQL previews in the OLAP UI. Do not label historic data as live. Do not invent performance numbers, GPS coordinates, or predictive model quality.

Files: `web/src/measured-glass.css` is loaded **after** `styles.css` and `premium.css`. UI dock markup lives in `web/src/App.tsx`, chart colors in `web/src/Premium.tsx`. Query and ETL files are intentionally unchanged.

## Verification

Run `cd web && npm ci && npm run build` and existing SQL regression tests. Review desktop and mobile at 1920, 1440, 1099, 760, 480, 374 and 320px. Check no text overlaps in revenue tiles or Brazilian state inspector, all six nav destinations, keyboard focus, CSV export and every OLAP filter. The provided capture does not tell us hover/motion durations; our chosen transitions are not claimed as measured.

This is an adaptation for PromisePulse, not a Cadra clone.

## Light and dark themes (PromisePulse implementation; **not** Cadra measurements)

The Cadra capture only measured a light interface. PromisePulse additionally provides an **original dark appearance**, inspired by charcoal glass with lime/violet highlights. Do not attribute its colors or behavior to the captured Cadra page.

- **Light:** the measured #efefec canvas, translucent white cards, black dock, #bcd4f2 accents.
- **Dark:** #0d1018 page canvas, #1e232e translucent cards, light #f4f6f8 text, muted #b4bac6 labels, #c4ea84 controls and lime/violet/blue data-series accents.
- **Single global control:** header theme toggle applies to every one of the six pages, loading and error states, tables, filters, charts, map inspector, command search and footer.
- **Persistence:** `promisepulse-theme` in localStorage stores the explicit choice; default is OS preference when no choice is stored. The `web/index.html` bootstrap applies the initial theme before the React application paints. Storage failures fall back to in-memory operation.
- **Cross-tab:** storage events synchronize explicit mode changes. Meta theme-color and CSS `color-scheme` update for native controls.
- **Theme-aware SVG:** charts and 27-state choropleth read `--pp-chart-*` and `--pp-map-*` variables rather than frozen bright/light colors. Only presentation changes; all underlying order counts, risk metrics and aggregate SQL remain untouched.
- **Accessibility:** the switch has an action-oriented accessible name, focus outline; reduced-motion preference applies to its transitions. Contrast and mobile overflow still require real-device/browser evaluation.

Implementation: `web/src/theme.css` must be loaded **last** after `measured-glass.css`. Theme state lives in `web/src/App.tsx`. Regression coverage lives in `tests/test_theme.cjs` and the GitHub Actions workflow.

Verify locally: `cd web && npm ci && npm run build && node ../tests/test_theme.cjs`. In a browser, toggle between light/dark and revisit Overview, Intelligence, OLAP Lab, Risk Center, Data Catalog and Pipeline & Quality; reload; open another tab; verify chart labels, date inputs, exports and table scrolling.
