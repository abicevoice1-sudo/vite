const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  let failures = 0;
  try {
    for (const path of ['/', '/profiles']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://localhost:5173${path}`);
      const drawer = page.locator('.mobile-nav-drawer');
      const open = async () => {
        await page.getByRole('button', { name: 'Open menu', exact: true }).click();
        await drawer.waitFor({ state: 'visible' });
        await page.waitForTimeout(500);
      };
      const check = async (name, test) => {
        try { await test(); console.log(`PASS ${path}: ${name}`); }
        catch (error) { failures++; console.error(`FAIL ${path}: ${name}: ${error.message}`); }
      };
      await open();
      await check('readable drawer contrast', async () => {
        const colors = await drawer.evaluate(element => ({
          background: getComputedStyle(element).backgroundColor,
          text: getComputedStyle(element.querySelector('nav a')).color,
        }));
        console.log(colors);
        assert.notEqual(colors.background, colors.text);
        const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number)
          .map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
          .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
        const values = [luminance(colors.background), luminance(colors.text)].sort((a, b) => b - a);
        assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5);
      });
      await page.screenshot({ path: `C:/Users/Mitchell/AppData/Local/Temp/drawer-${path === '/' ? 'home' : 'profiles'}.png` });
      await check('drawer link navigates', async () => {
        await drawer.getByRole('link', { name: 'Blog', exact: true }).click();
        await page.waitForURL('**/blog', { timeout: 4000 });
        await drawer.waitFor({ state: 'detached', timeout: 4000 });
      });
      if (await drawer.count()) {
        await page.locator('.mobile-nav-backdrop').click({ position: { x: 380, y: 400 } });
        await drawer.waitFor({ state: 'detached' });
      }
      await open();
      await check('outside click dismisses drawer', async () => {
        await page.mouse.click(380, 400);
        await drawer.waitFor({ state: 'detached', timeout: 4000 });
      });
      await check('no browser runtime errors', async () => assert.deepEqual(errors, []));
      await page.close();
    }
  } finally { await browser.close(); }
  if (failures) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
