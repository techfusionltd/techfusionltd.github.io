/**
 * Smoke-check for the multi-language privacy policy pages.
 *
 * These pages carry their own language switcher (en / vi / zh-Hans / zh-Hant);
 * the shared stylesheet was changed, so verify each page still switches
 * languages and that the EN/VI sections toggle correctly.
 *
 * Run: node tests/policy-pages-check.js
 */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

const ROOT = path.resolve(__dirname, '..');
const PAGES = [
  // Shared js/main.js switcher: [data-lang-target] + .lang-section-<lang>
  { file: 'privacy/simulated-ai-calls.html', langs: ['en', 'vi'], switcher: 'shared' },
  { file: 'privacy/muc-thuoc.html', langs: ['en', 'vi', 'zh-Hans', 'zh-Hant'], switcher: 'shared' },
  // Standalone page with its own setLang(): #btn-<lang> + #section-<lang>
  { file: 'privacy/habit-hero.html', langs: ['en', 'vi'], switcher: 'standalone' },
];

const PORT = 9800 + (process.pid % 300);
const PROFILE = path.join(os.tmpdir(), 'tf-policy-check-' + process.pid);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function findChrome() {
  return CHROME_CANDIDATES.find(p => fs.existsSync(p)) || null;
}

async function waitForTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find(t => t.type === 'page');
      if (page) return page;
    } catch {
      // Chrome not up yet
    }
    await sleep(250);
  }
  throw new Error('Chrome page target never became available');
}

const failures = [];

function check(name, condition, detail) {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures.push(name);
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

(async () => {
  const chromePath = findChrome();
  if (!chromePath) {
    console.log('skip: no Chrome/Chromium binary found');
    process.exit(0);
  }

  const chrome = spawn(chromePath, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${PROFILE}`,
    'about:blank',
  ], { stdio: 'ignore' });

  let ws;
  try {
    const target = await waitForTarget();
    ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 0;
    const pending = new Map();
    const consoleErrors = [];

    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(msg.params.exceptionDetails.text);
      }
    });

    const send = (method, params = {}) => new Promise(resolve => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

    const evaluate = async expression => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.result?.exceptionDetails) {
        throw new Error(r.result.exceptionDetails.text);
      }
      return r.result?.result?.value;
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    console.log('policy page checks:');

    for (const { file, langs } of PAGES) {
      await send('Page.navigate', { url: 'file://' + path.join(ROOT, file) });
      await sleep(1400);

      const info = await evaluate(`(() => ({
        title: (document.querySelector('.policy-title') || document.querySelector('h1'))?.textContent.trim() || '',
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        buttons: [...document.querySelectorAll('[data-lang-target]')].map(b => b.dataset.langTarget),
      }))()`);

      check(`${file} renders`, info.title.length > 0);
      check(`${file} has no horizontal overflow`, info.overflow <= 0, `overflows by ${info.overflow}px`);

      for (const lang of langs) {
        const switched = await evaluate(`(() => {
          const sharedBtn = document.querySelector('[data-lang-target="${lang}"]');
          const ownBtn = document.getElementById('btn-${lang}');
          const btn = sharedBtn || ownBtn;
          if (!btn) return { found: false };

          const shared = !!sharedBtn;
          btn.click();
          const active = document.documentElement.getAttribute('lang');

          // Count the content blocks that are visible for each language.
          const visible = lang => {
            if (shared) {
              return [...document.querySelectorAll('.lang-section-' + lang + ', [data-lang="' + lang + '"], #toc-' + lang)]
                .filter(el => !el.classList.contains('hidden')).length;
            }
            const own = document.getElementById('section-' + lang);
            return own && own.classList.contains('active') ? 1 : 0;
          };

          return { found: true, shared, active, visibleVi: visible('vi'), visibleEn: visible('en') };
        })()`);

        check(`${file} switches to ${lang}`, switched.found && (switched.shared ? switched.active === lang : switched.visibleEn >= 0), JSON.stringify(switched));
        if (lang === 'vi') {
          check(`${file} shows Vietnamese content`, switched.visibleVi > 0 && switched.visibleEn === 0, JSON.stringify(switched));
        }
        if (lang === 'en') {
          check(`${file} shows English content`, switched.visibleEn > 0 && switched.visibleVi === 0, JSON.stringify(switched));
        }
      }
    }

    // --- Muc Thước landing pages (four static files, one per language) ---
    for (const file of ['muc-thuoc/index.html', 'muc-thuoc/en.html', 'muc-thuoc/zh-hans.html', 'muc-thuoc/zh-hant.html']) {
      await send('Page.navigate', { url: 'file://' + path.join(__dirname, '..', file) });
      await sleep(1200);
      const landing = await evaluate(`(() => ({
        h1: document.querySelector('h1')?.textContent.trim() || '',
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }))()`);
      check(`${file} renders`, landing.h1.length > 0);
      check(`${file} has no horizontal overflow`, landing.overflow <= 0, `overflows by ${landing.overflow}px`);
    }

    // --- Custom software service pages: legal name per language ----------
    const SERVICE_PAGES = [
      { file: 'services/index.html', expected: 'Công ty TNHH Techfusion' },
      { file: 'services/en.html', expected: 'Techfusion company limited' },
    ];
    for (const { file, expected } of SERVICE_PAGES) {
      await send('Page.navigate', { url: 'file://' + path.join(__dirname, '..', file) });
      await sleep(1200);
      const svc = await evaluate(`(() => ({
        h1: document.querySelector('h1')?.textContent.trim() || '',
        body: document.body.textContent,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }))()`);
      check(`${file} renders`, svc.h1.length > 0);
      check(`${file} uses "${expected}"`, svc.body.includes(expected));
      check(`${file} has no horizontal overflow`, svc.overflow <= 0, `overflows by ${svc.overflow}px`);
    }

    // --- Legal name is language-correct inside the policy pages -----------
    const POLICY_NAME_CHECKS = [
      { file: 'privacy/muc-thuoc.html', viMarker: 'do <strong>Công ty TNHH Techfusion</strong>', enMarker: 'published by <strong>Techfusion company limited</strong>' },
      { file: 'privacy/simulated-ai-calls.html', viMarker: 'bởi <strong>Công ty TNHH Techfusion</strong>', enMarker: 'published by <strong>Techfusion company limited</strong>' },
      { file: 'privacy/habit-hero.html', viMarker: 'phát hành bởi <strong>Công ty TNHH Techfusion</strong>', enMarker: 'published by <strong>Techfusion company limited</strong>' },
    ];
    for (const { file, viMarker, enMarker } of POLICY_NAME_CHECKS) {
      await send('Page.navigate', { url: 'file://' + path.join(__dirname, '..', file) });
      await sleep(1200);
      const html = await evaluate(`document.documentElement.outerHTML`);
      check(`${file} uses the Vietnamese legal name in the Vietnamese section`, html.includes(viMarker), `missing "${viMarker}"`);
      check(`${file} uses the English legal name in the English section`, html.includes(enMarker), `missing "${enMarker}"`);
      check(`${file} no longer uses the old legal name`, !/Techfusion Ltd|TechFusion Ltd/.test(html));
    }

    // --- Custom software development landing pages (VI / EN) ---
    for (const file of ['services/index.html', 'services/en.html']) {
      await send('Page.navigate', { url: 'file://' + path.join(ROOT, file) });
      await sleep(1200);
      const svc = await evaluate(`(() => ({
        lang: document.documentElement.lang,
        h1: document.querySelector('h1')?.textContent.trim() || '',
        cards: document.querySelectorAll('.service-card').length,
        steps: document.querySelectorAll('.process-step').length,
        langLinks: [...document.querySelectorAll('.language-switch-bar .lang-btn')].map(a => a.getAttribute('href')),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }))()`);
      check(`${file} renders`, svc.h1.length > 0);
      check(`${file} has no horizontal overflow`, svc.overflow <= 0, `overflows by ${svc.overflow}px`);
      check(`${file} lists the four service cards`, svc.cards === 4, `got ${svc.cards}`);
      check(`${file} lists the five process steps`, svc.steps === 5, `got ${svc.steps}`);
      check(`${file} offers both languages`, svc.langLinks.includes('./') && svc.langLinks.includes('en.html'), JSON.stringify(svc.langLinks));
    }

    // --- Hidden apps: policy page stays reachable but is noindex ----------
    {
      await send('Page.navigate', { url: 'file://' + path.join(__dirname, '..', 'privacy/habit-hero.html') });
      await sleep(1200);
      const robots = await evaluate(`document.querySelector('meta[name="robots"]')?.content || ''`);
      check('hidden app policy page is noindex but still reachable', robots.includes('noindex'), `robots="${robots}"`);
    }

    check('no uncaught JavaScript errors', consoleErrors.length === 0, consoleErrors.join('; '));
  } finally {
    if (ws) ws.close();
    chrome.kill();
    await sleep(300);
    try {
      fs.rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // Leftover temp profile is harmless.
    }
  }

  if (failures.length) {
    console.error(`\n${failures.length} check(s) failed`);
    process.exit(1);
  }
  console.log('\nall checks passed');
  process.exit(0);
})().catch(err => {
  console.error('FAIL', err);
  process.exit(1);
});
