const { test, expect } = require('@playwright/test');

test('verify mobile ai website builder layout', async ({ page }) => {
  // Mobile Viewport
  await page.setViewportSize({ width: 375, height: 667 });

  // Try accessing a dashboard page directly
  // Note: Without auth this will likely redirect to login
  await page.goto('http://localhost:3000/dashboard/sites/test-project');

  // Wait for network idle to catch any redirects or loading
  await page.waitForLoadState('networkidle');

  // Take screenshot
  await page.screenshot({ path: 'verification/mobile_ui_result.png', fullPage: true });
});