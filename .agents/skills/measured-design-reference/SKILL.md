---
name: measured-design-reference
description: Apply the user-provided measured Cadra dashboard styles to PromisePulse's original analytics UI, without inventing uncaptured states or sacrificing data provenance.
---

# Measured design reference — PromisePulse 3

When modifying this repo, first read `design.md` and `web/src/measured-glass.css`.

## What the capture does and does not establish

The reference is the Cadra dashboard at https://demo.codeandchill.store/cadra/#/dashboard. Measurements came from 298 rendered elements at 1920 x 858px. This is computed CSS from one state, not the template source or a reconstruction of unobserved hover/mobile states. One stylesheet was not inspected. Accessibility still needs testing.

## Fidelity checklist

1. Preserve observed styles: off-white background `#efefec`; dark ink/dock `#111`; glass `rgba(255,255,255,.56)` and `rgba(255,255,255,.7)`; white rim `rgba(255,255,255,.8)`; soft line `rgba(17,17,17,.09)`; accent `#bcd4f2`; muted `#5c5c5a`.
2. Use Urbanist, headings around 38px/600, body around 13.5px/500, buttons around 14px/500. Keep responsive typography legible.
3. Use 24px rounded glass cards, fully rounded controls and measured shadow: `0 1px 0 #ffffffb3 inset, 0 24px 48px -30px #00000038`.
4. Prefer the 12px / 10px grid gaps and 18px card padding observed, adapting for dense analytical content.
5. The measured easing is `cubic-bezier(.2,.8,.2,1)`, but no motion duration was observed: motion values are our own conservative choices, always respecting reduced motion.
6. Responsive queries were observed at <=1279, <=1099, <=900, <=860, <=760, <=480 and <=374px. Do not assert what uncaptured layouts looked like.
7. Don't copy proprietary Cadra code, logos, images or factory-management sample data. Keep PromisePulse branding.

## Functional guardrails

Do not touch historical metric definitions or dataset loading just for appearance. Preserve DuckDB-Wasm query behavior, all six pages, OLAP drilldowns/rollups/filters, risk caveats, CSV export, error states, provenance and Olist grain semantics. Historical Brazilian state choropleth must not imply live GPS/tracking. Keep SQL preview hidden and results visible.

Review desktop + mobile, keyboard tab/focus, buttons, table overflow and reduced motion before claiming complete usability.

Refer to `design.md` for the measured palette, typographic roles, layout and verification notes.

## Appearance implementation

The original reference measured only light mode. Our dark palette is an **original PromisePulse choice**, not a source measurement. Read `web/src/theme.css` *after* `web/src/measured-glass.css`; do not remove the dark overrides when adjusting the design.

Preserve the single accessible header switch, saved `promisepulse-theme` preference, first-paint bootstrap in `web/index.html`, and CSS variables for charts/maps. Theme changes must work across all six routes, including command search, filters, tables, risk slider, data catalog, and pipeline screens. Do not recompute or mutate SQL/ETL/ML data to change appearance.

Run `node tests/test_theme.cjs` alongside `cd web && npm run build`. Always visually review both themes, desktop and mobile, since these static tests cannot establish runtime contrast or usability.
