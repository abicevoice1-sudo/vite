// Reproduce: tap the notifications bell on mobile, measure the popover.
import('playwright').then(async ({ chromium }) => {
  const BASE = 'http://127.0.0.1:5173';
  const browser = await chromium.launch();

  for (const vp of [{ width: 390, height: 844 }, { width: 430, height: 932 }, { width: 768, height: 1024 }]) {
    const page = await browser.newPage({
      viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    });
    await page.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'ali.khan@gmail.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });

    const bell = page.locator('[aria-label^="Notifications"]');
    const bellCount = await bell.count();
    const bellVisible = bellCount ? await bell.first().isVisible() : false;
    console.log('[' + vp.width + '] bell count:' + bellCount + ' visible:' + bellVisible);

    if (bellCount && bellVisible) {
      const bb = await bell.first().boundingBox();
      console.log('  bell rect:', JSON.stringify(bb));
      await bell.first().tap();
      await page.waitForTimeout(350);
      const info = await page.evaluate(() => {
        const region = document.querySelector('[role="region"][aria-label="Notifications"]');
        if (!region) return { found: false };
        const r = region.getBoundingClientRect();
        const st = getComputedStyle(region);
        const cs = getComputedStyle(document.querySelector('.landing-header'));
        // What element actually sits at the popover's center point?
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const stack = document.elementsFromPoint(cx, cy).slice(0, 4).map((el) =>
          el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]);
        return {
          found: true,
          rect: { l: Math.round(r.left), t: Math.round(r.top), rgt: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) },
          visibility: st.visibility, opacity: st.opacity, display: st.display, z: st.zIndex,
          headerOverflow: cs.overflow + '/' + cs.overflowX + '/' + cs.overflowY,
          headerZ: cs.zIndex, headerPos: cs.position,
          atCenter: stack,
          inViewport: r.left >= 0 && r.right <= window.innerWidth && r.bottom > 0 && r.top < window.innerHeight,
        };
      });
      console.log('  popover:', JSON.stringify(info, null, 2).slice(0, 600));
      await page.screenshot({ path: 'qa-screenshots/notif-' + vp.width + '.png' });
    }
    await page.close();
  }
  await browser.close();
}).catch((e) => { console.error('FAIL', e.message); process.exit(1); });