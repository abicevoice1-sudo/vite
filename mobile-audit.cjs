// Mobile QA sweep (390x844): horizontal-overflow check on all key pages,
// full-page screenshots for member pages, console-error gate.
// Usage: copy to a folder with playwright resolvable, then `node mobile-verify.cjs`.
import('playwright').then(async ({ chromium }) => {
  const BASE = 'http://127.0.0.1:5173';
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));

  const results = [];
  const check = async (pg, shot) => {
    await page.goto(BASE + pg, { waitUntil: 'networkidle' });
    await page.waitForTimeout(350);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    results.push({ pg, sw, bad: sw > 391 });
    if (shot) await page.screenshot({ path: 'qa-screenshots/m-' + shot + '.png', fullPage: true });
  };

  for (const pg of ['/', '/profiles', '/auth/login', '/pricing', '/community', '/blog', '/support']) {
    await check(pg);
  }

  await page.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'ali.khan@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  for (const pg of ['/dashboard', '/messages', '/settings', '/onboard', '/profiles']) {
    await check(pg, pg.replace(/\//g, '') || 'home');
  }

  results.forEach((r) =>
    console.log(r.pg.padEnd(14) + (r.bad ? 'OVERFLOW sw:' + r.sw : 'ok'))
  );
  console.log('ERRORS:' + errors.length + (errors.length ? ' :: ' + errors.slice(0, 5).join('|') : ''));
  await browser.close();
  const failed = results.some((r) => r.bad) || errors.length > 0;
  process.exit(failed ? 1 : 0);
}).catch((e) => { console.error('FAIL', e.message); process.exit(1); });