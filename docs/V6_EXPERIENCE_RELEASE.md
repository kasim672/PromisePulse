# PromisePulse V6 — Platform Experience Release

**Branch:** `feat/promisepulse-6-platform-experience` — review before merging into `main`.

This release develops the approved platform experience improvements. It **does not include** items 7 (new AI/ML models or explainability), 10 (new statistical hypothesis tests) or 11 (new geographic analytics).

## Implemented and testable

| Requested item | Implementation | How to test |
|---|---|---|
| 1. Performance | Code-split React routes; lazy-load DuckDB engine module; separate vendor chunk; keep Parquet static | `npm run build`, inspect Vite output bundles |
| 2. Mobile | New responsive layouts for shared filters, shortcuts, walkthrough, charts, dialogs and lineage | Chromium V6 workflow: 390 × 844 light/dark |
| 3. Unified design | Shared radii/focus tokens and consolidated new-feature styling | `web/src/experience.css` |
| 4. Interactive charts | Focus mode with full-size plot, raw bins, CSV and Escape support; retained chart mode selectors | Analytics Atlas → Focus on chart |
| 5. Dashboard customization | Persistent, keyboard-operable ordered workspace shortcuts on landing page | Welcome → Arrange shortcuts |
| 6. Global filtering | Shared and persisted purchase-year filter in Overview, Intelligence, Atlas and research; state shared across Atlas/research | Header filter bar, switch workspaces and verify controls |
| 8. Algorithm visualizers | Educational, clickable step-by-step walkthroughs for Decision Tree, K-Means, Apriori, FP-Growth and Eclat | Data Mining Lab → three method sections |
| 9. Data Mining Lab | In-context reproducibility downloads and evidence/explanation links | Open Classification, Clustering and Pattern Mining |
| 12. Report creation | Selectable printable evidence tables and warehouse bar graph from manifest | Header → Report → Print / Save as PDF |
| 13. Data lineage | Interactive, manifest-derived ETL diagram in Pipeline & Quality | Select lineage stage |
| 14. Search/navigation | Search indexes Analytics Atlas chart titles and links to their appropriate analysis lenses | Ctrl/Cmd+K → search a chart |
| 15. Reproducibility | Download measured `mining_lab.json` and inspect exporter script; evidence caveats retained | Data Mining Lab → Reproduce analysis |
| 16. Accessibility | Visible keyboard focus, semantic buttons/steps, Escape closing, reduced motion support | Tab and Shift+Tab, press Escape in chart focus |
| 17. Loading/error recovery | Lazy-route fallback, per-workspace error boundary, cancellable mining fetch and retry | Simulate missing `mining_lab.json` in development |
| 18. SEO | Updated title, description, canonical, Open Graph/Twitter tags, robots/sitemap | View source / social crawler |
| 19. CI/deployment | GitHub Action and Playwright smoke for responsive features and primary navigation | `v6-experience-smoke.yml` |
| 20. Documentation | This guide, project README instructions, reproducibility and known limits | `docs/V6_EXPERIENCE_RELEASE.md` |

## Important boundaries

- **Static public data:** Olist historical transactions (2016–2018), not live commerce, and client-side DuckDB-Wasm. The website does not run a persistent backend.
- **Algorithm stepper:** Illustrative educational steps. It does not retrain models when a visitor presses Next. Empirical results remain the reproducible offline exports.
- **Shared filters:** State applies to Atlas and Research SQL queries. Overview and Intelligence currently support the shared **year** only. Held-out classification evaluation remains a fixed cohort; it is not resliced by the global year.
- **Dashboard customization:** Reorders landing-page workspace shortcuts and three data-backed analytical widgets on Overview. Changes are stored locally per browser, not synced across accounts; underlying queries and calculations remain unchanged.
- **Report:** Uses print/PDF save in the browser; no server renders PDFs. Included chart depicts measured row counts rather than a screenshot of another dashboard.
- **Performance:** Route/code splitting limits initial JavaScript parsing. DuckDB-Wasm assets and Parquet still require substantial downloads on a first visit. No unsupported performance target or Lighthouse score is claimed.
- **SEO:** The SPA has a single indexable URL; individual in-app views are not prerendered or separately indexed.
- **Security:** No sensitive information, API tokens, GitHub credentials or user analytics are collected by new components. Saved settings stay in the user's browser.

## Local review

```bash
git fetch origin
git switch feat/promisepulse-6-platform-experience
cd web
npm ci
npm run build
npm run dev
```

On the website test all themes and viewport widths. Inspect the existing historical map for regressions; this release does not change its spatial data or behaviour.

## Regression checks

```bash
cd web
npm run build
node ../tests/test_experience.cjs
node ../tests/test_editorial_hierarchy.cjs
node ../tests/test_syllabus_modules.cjs
```

The GitHub Action additionally runs full-browser smoke tests against a local server and checks shared filters, focus mode, shortcut persistence, report preview, step-by-step algorithms and lineage exploration in both themes at desktop and mobile viewport sizes.

## Merge gate

- [ ] Web build and existing suites pass
- [ ] V6 browser smoke completes successfully
- [ ] All six academic labs, original dashboards and Brazilian state map still operate
- [ ] Mobile browser inspected on both themes
- [ ] User approves the pull request
- [ ] Merge into main and check the live Vercel deployment
