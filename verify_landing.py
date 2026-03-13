from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)
        page.screenshot(path="desktop_screenshot.png", full_page=True)

        page = browser.new_page(viewport={"width": 375, "height": 812})
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)
        page.screenshot(path="mobile_screenshot.png", full_page=True)
        browser.close()

run()
