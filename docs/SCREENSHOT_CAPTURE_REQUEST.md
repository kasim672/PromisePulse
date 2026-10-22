# Screenshot Capture Request

This file intentionally triggers `.github/workflows/capture-screenshots.yml` on the feature branch.

Requested capture: real PromisePulse 3.0 app using bundled Olist Parquet.
- 1440 × 900: seven routes in light and dark mode
- 1440 × 900: Analytics Atlas laboratory matrices in light and dark mode
- 390 × 844: Overview and Analytics Atlas on mobile
- Actual screenshots only, no mock UI or synthetic analytics data

After the workflow successfully commits `docs/screenshots/v3/`, update `README.md` and `docs/SCREENSHOT_GALLERY.md` to refer to the generated files. The manifest documents capture provenance and UTC date.

Rerun requested after mobile layout check fix. Capture script now waits for real app content rather than hidden status labels, and the artifact commit rebases onto the current documentation branch.
