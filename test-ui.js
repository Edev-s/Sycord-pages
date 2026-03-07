const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Create a minimal HTML wrapper around the Next.js component's output
  // We'll just render the raw HTML of the styles tab layout to verify our changes

  const html = `
    <!DOCTYPE html>
    <html class="dark">
    <head>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-black text-white p-8">
      <div class="flex flex-col max-w-2xl mx-auto space-y-6 pt-10 pb-20">
          <!-- Main Panel and Green Badge -->
          <div class="relative w-full">
              <!-- Main Panel -->
              <div class="w-full h-[400px] bg-[#222222] rounded-[24px]"></div>

              <!-- Green Badge overlapping -->
              <div class="absolute left-6 bottom-0 translate-y-[50%] flex items-center bg-[#0aa34f] text-white px-5 py-3 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-10">
                  <div class="relative mr-4 flex items-center justify-center">
                      <div class="absolute w-[18px] h-[18px] border-2 border-[#066e34] bg-[#0aa34f] rotate-45 rounded-[2px]"></div>
                      <div class="w-[18px] h-[18px]"></div>
                  </div>
                  <span class="font-bold text-[15px] tracking-wide">Your site is now live!</span>
              </div>
          </div>

          <!-- Action Row -->
          <div class="flex items-center justify-between w-full px-2 pt-6">
              <div class="flex items-center gap-4">
                  <div class="w-[22px] h-[22px] bg-[#333333] rounded-[4px]"></div>
                  <span class="text-white font-semibold text-[15px]">Domain.com</span>
              </div>
              <div class="w-[100px] h-[34px] bg-[#333333] rounded-full"></div>
          </div>

          <!-- Secondary Wide Panel -->
          <div class="w-full h-[180px] bg-[#121212] rounded-[20px] mt-2"></div>

          <!-- Bottom Grid -->
          <div class="grid grid-cols-3 gap-6 w-full mt-4">
              <div class="h-[100px] rounded-[16px] border-2 border-[#2a2a2a] bg-transparent"></div>
              <div class="h-[100px] rounded-[16px] border-2 border-[#2a2a2a] bg-transparent"></div>
              <div class="h-[100px] rounded-[16px] border-2 border-[#2a2a2a] bg-transparent"></div>
          </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(1000); // wait for tailwind to process

  await page.screenshot({ path: '/tmp/ui-test.png' });

  await browser.close();
})();
