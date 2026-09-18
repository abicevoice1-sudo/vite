// scripts/compare-servers.mjs
// ─── Load the same page from two dev servers and diff what renders ───────────
// Run:  node scripts/compare-servers.mjs <urlA> <urlB>
// Prints the resolved theme tokens and stylesheet URL from each, so a
// "which folder has my colours?" question is answered from the running app
// rather than from timestamps on disk.

const [urlA, urlB] = process.argv.slice(2);

const PROBE = () => {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const sheets = Array.from(document.styleSheets).map((s) => s.href).filter(Boolean);
  const tokenNames = [
    '--color-primary',
    '--color-canvas',
    '--color-ink',
    '--color-accent',
    '--color-border',
    '--color-elevated',
  ];
  const tokens = {};
  for (const name of tokenNames) {
    tokens[name] = cs.getPropertyValue(name).trim() || null;
  }
  return {
    title: document.title,
    classes: root.className,
    themeAttr: root.getAttribute('data-theme'),
    stylesheets: sheets,
    tokens,
    inlineVarCount: (root.getAttribute('style') || '').split(';').filter(Boolean).length,
  };
};

async function inspect(browser, url) {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  const result = await page.evaluate(PROBE);
  await page.close();
  return { url, ...result, consoleErrors: errors };
}

const { chromium } = await import('patchright').catch(() => import('playwright'));

const browser = await chromium.launch();
try {
  const a = await inspect(browser, urlA);
  const b = await inspect(browser, urlB);
  process.stdout.write(JSON.stringify({ a, b }, null, 2) + '\n');
} finally {
  await browser.close();
}
