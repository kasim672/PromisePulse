---
name: measured-design-reference
description: Build or audit PromisePulse glass UI using measured Cadra-style tokens and traceable implementation decisions; do not invent uncaptured states.
---

# Measured design reference for PromisePulse

Read \`design.md\` first. Source capture: https://demo.codeandchill.store/cadra/#/dashboard, 298 elements, desktop 1920×858. The measurements reflect only a sampled state, not the original design source or license.

## Required measurements

- Canvas \`#efefec\`; light surface \`#f8f8f6\`; text/dock \`#111\`.
- Translucent cards: \`rgba(255,255,255,.56)\`; raised panels: \`rgba(255,255,255,.7)\`.
- Highlight border: \`rgba(255,255,255,.8)\`; divider: \`rgba(17,17,17,.09)\`.
- Standard shadow: \`0 1px 0 #ffffffb3 inset, 0 24px 48px -30px #00000038\`.
- Urbanist; heading 38/600/39.52, section 15/600/21.75, body 13.5/500/19.575; compact buttons 14/500.
- Measured radii 10px control, 24px card, 999px pill; frequent 10–18px padding and 12px grid gaps.
- Functional colors: blue \`#bcd4f2\`, success \`#237a48\`, failure \`#bf3644\`, muted \`#5c5c5a\`.

## Component recipes

- Hero: \`#f8f8f6\`, two low-opacity blue corner radial gradients, 24px radius, 24px horizontal padding, the measured dual shadow.
- Glass card: white .56 alpha, 1px white .8 rim, 24px radius, 18px padding, subtle hover emphasis.
- Dock: ink \`#111\` with accessible light icons, clearly indicated active route, tooltip on desktop; original responsive bottom dock at narrow widths.
- Controls: light .7 alpha, readable dark text, 999px pill or compact 10px rectangle, 3px keyboard focus ring.
- Map: use supplied real state polygons and user-selected historical order totals. Never imply live tracking or GPS.
- Use a measured hue where appropriate but do not replace PromisePulse's existing logo/favicon identity.

## Behavioral and integrity rules

Keep browser DuckDB-Wasm, Parquet exports, SQL semantics, correct fact grains, historical delivery interpretation, and trained-model disclosures. Aesthetic refactoring must not change metric calculations. Preserve filters/results and CSV downloads. SQL editor/preview must not reappear. Respect reduced-motion, keyboard focus, mobile safe area, truncation and font loading fallback.

The supplied measurement did **not** record animation durations/easing in an interaction, most hover/focus states, mobile screenshots, or complete stylesheets. Test those directly and label implementation choices as such. Do not copy proprietary Cadra source or branding.
