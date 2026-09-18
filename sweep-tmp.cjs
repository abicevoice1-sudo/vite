// multi-agent-sweep.cjs — simultaneous multi-user + multi-admin sweep.
// Run from Downloads/migration (has playwright + browsers):
//   node c:/Users/Mitchell/Downloads/try/test/migration/scripts/multi-agent-sweep.cjs
// 9 isolated contexts in PARALLEL, one agent per account. JSON to stdout.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.SWEEP_BASE || 'http://127.0.0.1:5173';
const OUT = 'c:/Users/Mitchell/Downloads/try/test/migration/qa-screenshots';
const PW = 'password123';

const AGENTS = [
  { agent: 'user-ali', email: 'ali.khan@gmail.com', role: 'user' },
  { agent: 'user-aisha', email: 'aisha.rahman@gmail.com', role: 'user' },
  { agent: 'user-omar', email: 'omar.farooq@gmail.com', role: 'user' },
  { agent: 'user-maryam', email: 'maryam.siddiqui@gmail.com', role: 'user' },
  { agent: 'user-yusuf', email: 'yusuf.mohamed@gmail.com', role: 'user' },
  { agent: 'user-zainab', email: 'zainab.hassan@gmail.com', role: 'user' },
  { agent: 'admin-super', email: 'admin@shiarishta.com', role: 'admin' },
  { agent: 'admin-imam', email: 'hassan.imam@shiarishta.com', role: 'admin' },
  { agent: 'admin-moderator', email: 'fatima.moderator@shiarishta.com', role: 'admin' },
];

const USER_FLOW = [
  { url: '/dashboard', shot: 'dashboard', expect: 'Assalam' },
  { url: '/profiles', shot: 'profiles', expect: 'rofile' },
  { url: '/messages', shot: 'messages', expect: 'essage' },
  { url: '/onboard', shot: 'onboard', expect: 'ssential' },
  { url: '/settings', shot: 'settings', expect: 'etting' },
  { url: '/pricing', shot: 'pricing', expect: 'lan' },
  { url: '/blog', shot: 'blog', expect: 'log' },
  { url: '/community', shot: 'community', expect: 'ommunity' },
  { url: '/support', shot: 'support', expect: 'upport' },
];
const ADMIN_FLOW = [
  { url: '/admin/dashboard', shot: 'admin-dashboard', expect: 'ember' },
  { url: '/admin/messages', shot: 'admin-messages', expect: 'essage' },
  { url: '/admin/support', shot: 'admin-support', expect: 'upport' },
  { url: '/admin/guardians', shot: 'admin-guardians', expect: 'uardian' },
  { url: '/admin/analytics', shot: 'admin-analytics', expect: 'nalytic' },
  { url: '/dashboard', shot: 'user-dashboard-as-admin', expect: 'Assalam' },
  { url: '/profiles', shot: 'profiles-as-admin', expect: 'rofile' },
];

async function runAgent(browser, spec) {
  const dir = path.join(OUT, spec.agent);
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGE:' + String(e.message).slice(0, 180)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE:' + m.text().slice(0, 180)); });
  const flow = spec.role === 'admin' ? ADMIN_FLOW : USER_FLOW;
  const loginUrl = spec.role === 'admin' ? '/admin' : '/auth/login';
  const steps = [];

  await page.goto(BASE + loginUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  try {
    await page.fill('input[type="email"]', spec.email, { timeout: 8000 });
    await page.fill('input[type="password"]', PW, { timeout: 8000 });
    await page.click('button[type="submit"]', { timeout: 8000 });
    await page.waitForTimeout(2500);
    const afterLogin = page.url();
    const loginOk = spec.role === 'admin'
      ? afterLogin.includes('/admin/dashboard')
      : afterLogin.includes('/dashboard');
    steps.push({ step: 'login', ok: loginOk, url: afterLogin });
    await page.screenshot({ path: path.join(dir, '00-login' + (loginOk ? '' : '-FAIL') + '.png') });
    if (!loginOk) throw new Error('no redirect (at ' + afterLogin + ')');
  } catch (e) {
    steps.push({ step: 'login', ok: false, error: String(e.message).slice(0, 200) });
    await ctx.close();
    return { agent: spec.agent, email: spec.email, role: spec.role, ok: false, steps, errors };
  }

  let n = 1;
  for (const s of flow) {
    try {
      await page.goto(BASE + s.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1200);
      const body = await page.evaluate(() => document.body.innerText.slice(0, 12000));
      const ok = body.toLowerCase().includes(s.expect.toLowerCase());
      const footer = await page.evaluate(() => !!document.querySelector('footer.site-footer'));
      steps.push({ step: s.shot, ok: ok && footer, textMatch: ok, footer, url: page.url() });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(600);
      const tag = (ok && footer) ? '' : '-FAIL';
      await page.screenshot({ path: path.join(dir, String(n).padStart(2, '0') + '-' + s.shot + tag + '.png') });
    } catch (e) {
      steps.push({ step: s.shot, ok: false, error: String(e.message).slice(0, 200) });
    }
    n += 1;
  }
  await ctx.close();
  return { agent: spec.agent, email: spec.email, role: spec.role, ok: steps.every((s) => s.ok), steps, errors: errors.slice(0, 6) };
}

(async () => {
  const browser = await chromium.launch();
  const started = Date.now();
  const results = await Promise.all(AGENTS.map((a) => runAgent(browser, a)));
  await browser.close();
  const summary = {
    base: BASE, ms: Date.now() - started,
    agents: results.length, passed: results.filter((r) => r.ok).length, results,
  };
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
})().catch((e) => { console.error('SWEEP-FAIL:' + e.message); process.exit(1); });
