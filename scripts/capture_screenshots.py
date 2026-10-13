import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "docs/screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def capture():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch()
        
        # 1. Desktop Context (1600x900)
        context = await browser.new_context(
            viewport={"width": 1600, "height": 900},
            device_scale_factor=1.5
        )
        page = await context.new_page()

        print("Navigating to dashboard...")
        await page.goto("http://127.0.0.1:5173", wait_until="networkidle")

        # Wait until DuckDB initializes and table/charts load
        # App displays "LOCAL SQL READY" in header when db is loaded
        await page.wait_for_selector(".header-online", timeout=20000)
        await page.wait_for_timeout(3000) # Ensure DuckDB queries populate
        
        print("Capturing 01_overview.png / overview.png...")
        await page.screenshot(path=f"{SCREENSHOT_DIR}/overview.png", full_page=False)

        # 2. Revenue & Analytics charts (scrolled slightly or zoomed on overview)
        print("Capturing 02_revenue-analytics.png...")
        revenue_el = await page.wait_for_selector(".revenue-chart")
        # Scroll element into view
        await revenue_el.scroll_into_view_if_needed()
        await page.wait_for_timeout(500)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/revenue-analytics.png", full_page=False)

        # 3. OLAP Lab: Roll-up
        print("Navigating to OLAP Lab...")
        await page.click("button.header-nav-item:has-text('OLAP Lab')")
        await page.wait_for_timeout(2000)
        
        # Ensure Roll-up is selected and executed
        print("Capturing olap-rollup.png...")
        await page.click("button.op-tab:has-text('Roll-up')")
        await page.click("button.primary-btn:has-text('Execute SQL')")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/olap-rollup.png", full_page=False)

        # 4. OLAP Lab: Drill-down
        print("Executing Drill-down...")
        await page.click("button.op-tab:has-text('Drill-down')")
        await page.click("button.primary-btn:has-text('Execute SQL')")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/olap-drilldown.png", full_page=False)

        # 5. OLAP Lab: Slice
        print("Executing Slice...")
        await page.click("button.op-tab:has-text('Slice')")
        await page.click("button.primary-btn:has-text('Execute SQL')")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/olap-slice.png", full_page=False)

        # 6. OLAP Lab: Dice
        print("Executing Dice...")
        await page.click("button.op-tab:has-text('Dice')")
        await page.click("button.primary-btn:has-text('Execute SQL')")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/olap-dice.png", full_page=False)

        # 7. OLAP Lab: Pivot
        print("Executing Pivot...")
        await page.click("button.op-tab:has-text('Pivot')")
        await page.click("button.primary-btn:has-text('Execute SQL')")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/olap-pivot.png", full_page=False)

        # 8. Risk Investigation Center
        print("Navigating to Risk Center...")
        await page.click("button.header-nav-item:has-text('Risk Center')")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/risk-center.png", full_page=False)

        # 9. Historical risk predictions & queue (scroll to table)
        print("Capturing risk predictions table...")
        table_panel = await page.wait_for_selector(".panel:has-text('Risk-ranked order investigation')")
        await table_panel.scroll_into_view_if_needed()
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/risk-predictions-queue.png", full_page=False)

        # 10. Model evaluation metrics & confusion matrix
        print("Capturing model evaluation panel...")
        metrics_panel = await page.wait_for_selector(".panel:has-text('Model evaluation')")
        await metrics_panel.scroll_into_view_if_needed()
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/model-evaluation.png", full_page=False)

        # 11. Data Catalog
        print("Navigating to Data Catalog...")
        await page.click("button.header-nav-item:has-text('Data Catalog')")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/data-catalog.png", full_page=False)

        # 12. Warehouse fact and dimension tables (Catalog table preview)
        print("Capturing warehouse table browser...")
        catalog_table = await page.wait_for_selector(".panel:has-text('Interactive warehouse browser')")
        await catalog_table.scroll_into_view_if_needed()
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/warehouse-tables.png", full_page=False)

        # 13. Pipeline and Data Quality
        print("Navigating to Pipeline & Quality...")
        await page.click("button.header-nav-item:has-text('Pipeline & Quality')")
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/data-quality.png", full_page=False)

        # 14. Data reconciliation / validation results
        print("Capturing quality assertions / reconciliation panel...")
        quality_assertions = await page.wait_for_selector(".panel:has-text('Quality assertions')")
        await quality_assertions.scroll_into_view_if_needed()
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/data-reconciliation.png", full_page=False)

        await context.close()

        # 15. Mobile responsive layout
        print("Capturing mobile responsive layout...")
        mobile_context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        mobile_page = await mobile_context.new_page()
        await mobile_page.goto("http://127.0.0.1:5173", wait_until="networkidle")
        await mobile_page.wait_for_selector(".kpi-card", timeout=20000)
        await mobile_page.wait_for_timeout(3000)
        await mobile_page.screenshot(path=f"{SCREENSHOT_DIR}/mobile-overview.png", full_page=False)

        # Also capture mobile menu opened
        await mobile_page.click("button.menu-toggle")
        await mobile_page.wait_for_timeout(800)
        await mobile_page.screenshot(path=f"{SCREENSHOT_DIR}/mobile-menu.png", full_page=False)

        await mobile_context.close()
        await browser.close()
        print("All screenshots successfully captured!")

if __name__ == "__main__":
    asyncio.run(capture())
