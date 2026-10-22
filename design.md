# PromisePulse 3.0 — Measured Glass Workspace

## Provenance

Design reference: https://demo.codeandchill.store/cadra/#/dashboard
User-supplied capture: 298 rendered elements at **1920 × 858** on the Cadra dashboard.
This is a **style sample**, not source code or a guarantee about hover behavior, accessibility, alternate views, or responsive screenshots. The implementation is an original PromisePulse React UI; no Cadra assets, source, content, or manufacturing workflows are copied.

## Tokens measured in the supplied capture

| Role | Original measured CSS value | Application |
| --- | --- | --- |
| Canvas | \`#efefec\` | Off-white workspace background |
| Raised surface | \`#f8f8f6\` | Hero and main intro surfaces |
| Ink and dock | \`#111\` | Typography, primary controls and vertical dock |
| Dock foreground | \`#f7f7f5\` | White-on-black controls |
| Muted / faint | \`#5c5c5a\` / \`#73736f\` | Secondary text |
| Primary accent | \`#bcd4f2\` | Chart/map highlights and refined accent wash |
| Glass 1 | \`rgba(255,255,255,.56)\` | Analytics cards |
| Glass 2 | \`rgba(255,255,255,.7)\` | Control surfaces and inspectors |
| Rim | \`rgba(255,255,255,.8)\` | Glass inset borders |
| Divider | \`rgba(17,17,17,.09)\` | Separators |
| Strong divider | \`rgba(17,17,17,.16)\` | Controls and raised states |
| Success | \`#237a48\` | Delivery success / integrity / valid status |
| Failure | \`#bf3644\` | Risk and validation failure |
| Warning | \`#8f6000\` | Caution |

Font family: **Urbanist**, system sans-serif fallback.
Measured title: **38px, 600, 39.52px line-height, -.95px letter-spacing**.
Measured section: **15px, 600, 21.75px line-height**.
Measured body: **13.5px, 500, 19.575px line-height**.
Measured buttons: **14px, 500, 20.3px line-height**.

Observed common spacing/padding: **10px, 17px, 18px**. Common gaps: **7px, 10px, 12px**.
Observed radii: **10px** for compact controls, **24px** for cards, **999px** for pills.
Observed shadow: \`0 1px 0 #ffffffb3 inset, 0 24px 48px -30px #00000038\`.
Observed app maximum width: **1840px**.
Observed easing variable: \`cubic-bezier(.2,.8,.2,1)\`.
Observed breakpoints included **1279, 1099, 900, 860, 760, 480, 374px**. They do not prove a particular layout at those widths.

## Original PromisePulse adaptations (not measurements)

- A vertical black icon rail with tooltip labels on desktop and a persistent icon dock at the bottom on touch/mobile. All six routes remain available.
- A dark header badge behind the existing white/violet/lime PromisePulse artwork to keep logo contrast on light glass.
- One shared card, form, heading, focus and hover vocabulary across Overview, Intelligence, OLAP Lab, Risk Center, Data Catalog and Pipeline & Quality.
- A pale blue scale for the real Brazil state-aggregate choropleth, with a selected state inspector. **No GPS, live vehicle or invented real-time tracking.**
- SVG, tabular, and query components use the original DuckDB-Wasm/Parquet warehouse. Re-theme visualization colors; do not fabricate data.
- Motion timing at 200ms is an **implementation choice**. The source capture did not measure motion duration.
- Hover, focus, sticky dock, and small-screen behavior are original implementation decisions based on usability testing needs; not assertions about Cadra's original code.

## Quality gates

1. `cd web && npm ci && npm run build`
2. Confirm the historical 99,441 order facts and warehouse manifest are unmodified.
3. Use browser tests to check Overview / Intelligence / OLAP Lab / Risk Center / Data Catalog / Pipeline & Quality with keyboard and pointer.
4. At desktop 1920 × 858 and mobile 390 × 844, confirm no horizontal overflow, dock overlap, cropped KPI or illegible small text.
5. Check all filters, map selection with Enter/Space, OLAP result export and error recovery.
6. No raw SQL query preview in explorer or catalog. SQL execution remains internal.
7. Audit contrast, focus rings and `prefers-reduced-motion`. Animations must never block functionality.

## Files

- `web/src/styles.css`: legacy baseline components.
- `web/src/premium.css`: legacy premium dashboard definitions.
- `web/src/cadra.css`: final measured-inspired design token and component overrides, imported last.
- `web/src/App.tsx`: global dock and page structure.
- `web/src/Premium.tsx`: existing real-data chart and map components.
