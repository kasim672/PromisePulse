# PromisePulse — Reference-matched React redesign

This UI update was developed against the supplied **Modern Luxury Design System** HTML reference. It does not alter, simulate, or replace the analytics pipeline or the Olist data.

## Design language

| Reference property | Implementation |
|---|---|
| White `#FFFFFF` background | Main canvas and panel surfaces |
| Primary blue `#2563EB` | Header brand, buttons, charts, active navigation |
| Dark blue `#1E40AF` | Hover states and emphasis |
| Light blue `#EFF6FF` | Background of labels, chart rails, hover rows |
| Dark text `#333333` | Titles, figures and body headings |
| Grey `#6B7280`, `#999999` | Body/supporting labels |
| Border `#E8E8E8` | Cards and inputs |
| Plus Jakarta Sans | Main UI font |
| JetBrains Mono | SQL, dates, technical metadata |
| 24px cards with restrained shadow | Analytics KPI and query panels |
| Sticky header with horizontal navigation | App shell, mobile collapsible menu |
| Large editorial hero and blue emphasis | Overview, OLAP Lab, Risk Center, Catalog, Quality |
| Dark technical token panel | Executable SQL query preview and build commands |

## Functional behavior retained

- DuckDB-Wasm executes warehouse queries locally in the browser.
- Real Olist Parquet exports remain in `web/public/data/` and are not modified.
- OLAP roll-up, drill-down, slice, dice, pivot, date and state filters, SQL execution, CSV exports all remain intact.
- Risk slider and confusion-matrix recalculation, score list, and genuine model metrics remain intact.
- Data Catalog, source attribution, and row previews remain intact.
- Pipeline lineage, data quality and row-count evidence remain intact.
- Responsive navigation is collapsible at small viewports.

## Apply to your already-working local project

Do not delete your existing `web/public/data` folder: it contains your real Olist warehouse export.

From `~/Downloads`, extract the `promisepulse-luxury-ui-patch.zip` archive, then:

```bash
cd ~/Downloads/promisepulse-react-mvp
cp web/src/App.tsx web/src/App.tsx.backup
cp web/src/styles.css web/src/styles.css.backup
cp ~/Downloads/promisepulse-luxury-ui-patch/web/src/App.tsx web/src/App.tsx
cp ~/Downloads/promisepulse-luxury-ui-patch/web/src/styles.css web/src/styles.css
cp ~/Downloads/promisepulse-luxury-ui-patch/web/index.html web/index.html
cd web
npm run build
npm run dev
```

Open `http://127.0.0.1:5173`.

Do not rerun data export unless you need to refresh the real CSVs or retrain the model. This patch changes presentation code only.

## QA scope

- Static TSX syntax parse: passed.
- CSS syntax parse: passed.
- All existing SQL/data pipeline files copied unchanged.
- Full npm build and browser QA: must be run in a local environment with installed npm dependencies; they could not run in this build container.
