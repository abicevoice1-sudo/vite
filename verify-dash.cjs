// Header corner verification: screenshots + counts in both states,
// including the opened appearance popover.
import('playwright').then(async ({ chromium }) => {
  const BASE = 'http://127.0.0.1:5173';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 150)); });
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 150)));

  // Logged out
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'qa-screenshots/hdr-out.png', clip: { x: 640, y: 0, width: 800, height: 84 } });

  // Logged in
  await page.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'ali.khan@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'qa-screenshots/hdr-in.png', clip: { x: 640, y: 0, width: 800, height: 84 } });

  // Appearance popover open
  await page.click('.theme-menu-trigger');
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'qa-screenshots/hdr-theme-open.png', clip: { x: 640, y: 0, width: 800, height: 300 } });
  const popoverVisible = await page.locator('.theme-menu-popover').count();

  const gears = await page.locator('.theme-menu-trigger').count();
  const avatar = await page.locator('.landing-avatar-btn').count();
  const dashLinks = await page
    .locator('.landing-header-actions a', { hasText: 'Dashboard' })
    .count();
  const avatarText = await page.locator('.landing-avatar-btn').first().textContent();

  console.log('gear:' + gears + ' avatar:' + avatar + '(' + avatarText + ') dashboardLinks:' + dashLinks + ' popover:' + popoverVisible);
  console.log('CONSOLE_ERRORS ' + errors.length + (errors.length ? ' :: ' + errors.join(' | ') : ''));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
}).catch((e) => { console.error('FAIL', e.message); process.exit(1); });