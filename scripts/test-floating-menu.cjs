const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const { createServer } = await import('vite');
  const root = 'C:/Users/Mitchell/Downloads/try/test/migration';
  const server = await createServer({ root, configFile: `${root}/vite.config.js`, server: { port: 0, host: '127.0.0.1', open: false } });
  await server.listen();
  const baseURL = `http://127.0.0.1:${server.httpServer.address().port}`;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${baseURL}/profiles`);
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    const panel = page.locator('.mobile-nav-drawer');
    await panel.waitFor({ state: 'visible' });
    assert.equal(await panel.locator('nav a').count(), 4);
    await panel.getByRole('button', { name: 'Close menu', exact: true }).click();
    await panel.waitFor({ state: 'detached' });
    assert.deepEqual(errors, []);
    for (const theme of ['light', 'dark']) {
      for (const width of [320, 390, 768, 900, 1023, 1024, 1280]) {
        const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: width === 390 ? 'no-preference' : 'reduce' });
        await context.addInitScript(theme => localStorage.setItem('shiarishta_theme:v3', theme), theme);
        const testPage = await context.newPage();
        const runtimeErrors = [];
        testPage.on('pageerror', error => runtimeErrors.push(error.message));
        for (const route of ['/', '/profiles']) {
          await testPage.goto(`${baseURL}${route}`);
          const toggle = testPage.locator('.landing-menu-btn');
          await testPage.locator('.landing-header').waitFor();
          if (width >= 1024) {
            assert.equal(await toggle.isVisible(), false);
            assert.equal(await testPage.locator('.landing-nav').isVisible(), true);
          } else {
            assert.equal(await toggle.isVisible(), true);
            await toggle.click();
            const card = testPage.getByRole('dialog', { name: 'Mobile navigation' });
            await card.waitFor();
            await testPage.waitForFunction(() => {
              const card = document.querySelector('.mobile-nav-drawer');
              const backdrop = document.querySelector('.mobile-nav-backdrop');
              return card && backdrop && getComputedStyle(card).opacity === '1' && getComputedStyle(backdrop).opacity === '1';
            });
            assert.equal(await testPage.locator('.mobile-nav-backdrop').isVisible(), true);
            const styles = await card.evaluate(el => {
              const s = getComputedStyle(el);
              return { bg: s.backgroundColor, radius: s.borderRadius, rect: el.getBoundingClientRect().toJSON() };
            });
            assert.equal(styles.bg, theme === 'light' ? 'rgb(255, 250, 244)' : 'rgb(25, 20, 16)');
            assert.equal(styles.radius, '24px');
            assert.ok(styles.rect.x >= 10 && styles.rect.right <= width - 10);
            assert.ok(styles.rect.height < 844 - 24);
            assert.equal(await testPage.evaluate(() => document.body.style.overflow), 'hidden');
            if (route === '/profiles') assert.equal(await card.locator('[aria-current="page"]').innerText(), 'Profiles');
            if (width === 390 && route === '/profiles') await testPage.screenshot({ path: `C:/Users/Mitchell/AppData/Local/Temp/floating-menu-${theme}.png` });
            await card.locator('a').last().focus();
            await testPage.keyboard.press('Tab');
            assert.equal(await card.locator('a').first().evaluate(el => el === document.activeElement), true);
            await testPage.keyboard.press('Escape');
            await card.waitFor({ state: 'detached' });
            assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
            assert.notEqual(await testPage.evaluate(() => document.body.style.overflow), 'hidden');
            await toggle.click();
            await card.waitFor();
            await testPage.mouse.click(2, 600);
            await card.waitFor({ state: 'detached' });
            await toggle.click();
            await card.getByRole('link', { name: 'Blog', exact: true }).click();
            await testPage.waitForURL('**/blog');
            await card.waitFor({ state: 'detached' });
          }
          console.log(`PASS ${theme} ${width}px ${route}: layout and interactions`);
        }
        if (width === 390) {
          await testPage.locator('.landing-menu-btn').click();
          await testPage.setViewportSize({ width: 1280, height: 800 });
          await testPage.locator('.mobile-nav-drawer').waitFor({ state: 'detached' });
          assert.notEqual(await testPage.evaluate(() => document.body.style.overflow), 'hidden');
        }
        assert.deepEqual(runtimeErrors, []);
        await context.close();
      }
    }
    console.log('PASS: theme, viewport, keyboard, backdrop, navigation and resize regression checks.');
  } finally { await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
