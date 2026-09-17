import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = 'https://arnavgoel03.github.io/Power-grid-analysis/';
const out = process.env.ARTIFACT_DIR || 'artifacts';
await mkdir(out, { recursive: true });
const source = await readFile(process.env.README_PATH || 'README.md', 'utf8');
const expected = [...source.matchAll(/<iframe\b[^>]*>/gs)].map(([tag]) => ({
  src: tag.match(/src="([^"]+)"/)[1],
  height: Number(tag.match(/height="(\d+)"/)[1]),
}));
assert.equal(expected.length, 10);
const documentURLs = new Set(expected.map(frame => new URL(frame.src, url).href));
const finalDocumentURL = new URL(expected.at(-1).src, url).href;

function trackDocumentRequests(page) {
  const requested = new Set();
  page.on('request', request => {
    if (request.resourceType() === 'document' && documentURLs.has(request.url())) {
      requested.add(request.url());
    }
  });
  return requested;
}

function assertInitialDeferral(requested) {
  assert(requested.size < expected.length, 'All ten frame documents requested before scrolling');
  assert(!requested.has(finalDocumentURL), 'Final figure requested before scrolling');
}

async function checkEagerControl(context) {
  const control = await context.newPage();
  control.setDefaultTimeout(15000);
  const requested = trackDocumentRequests(control);
  try {
    const response = await control.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    assert.equal(response.status(), 200);
    const frames = control.locator('iframe[src^="assets/"]');
    assert.equal(await frames.count(), expected.length);
    await frames.evaluateAll(elements => {
      for (const element of elements) element.loading = 'eager';
    });
    const deadline = Date.now() + 15000;
    while (requested.size < expected.length && Date.now() < deadline) {
      await control.waitForTimeout(50);
    }
    assert.equal(requested.size, expected.length, 'Eager control did not request every document');
    assert.throws(() => assertInitialDeferral(requested), /requested before scrolling/);
    return requested.size;
  } finally { await control.close(); }
}

const browser = await chromium.launch();
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 393, height: 852 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    // Observe starts before navigation: frame URLs only change when pending
    // document requests commit, which can hide eager downloads on a slow link.
    const requested = trackDocumentRequests(page);
    const response = await page.goto(url, { waitUntil: 'load', timeout: 25000 });
    assert.equal(response.status(), 200);
    const frames = page.locator('iframe[src^="assets/"]');
    await frames.first().waitFor();
    assert.equal(await frames.count(), 10);
    for (let i = 0; i < expected.length; i++) {
      assert.equal(await frames.nth(i).getAttribute('loading'), 'lazy');
      assert.equal(await frames.nth(i).getAttribute('src'), expected[i].src);
      assert.equal(Number(await frames.nth(i).getAttribute('height')), expected[i].height);
    }
    await page.waitForFunction(() => document.fonts.status === 'loaded');
    // Allow lazy-load scheduling after the load/font layout boundary. This is
    // a bounded startup observation, not an assertion about every future timer.
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/${viewport.width}-opening.png` });
    const initiallyRequested = [...requested];
    assertInitialDeferral(requested);
    let charts = 0, tables = 0;
    for (let i = 0; i < expected.length; i++) {
      const element = frames.nth(i);
      await element.scrollIntoViewIfNeeded();
      const handle = await element.elementHandle();
      const frame = await handle.contentFrame();
      if (expected[i].src.includes('table') || expected[i].src.includes('df_head')) {
        await frame.locator('table').waitFor(); tables++;
      } else {
        await frame.locator('.plotly-graph-div .main-svg').first().waitFor(); charts++;
      }
      const box = await element.boundingBox();
      assert(Math.abs(box.height - expected[i].height) <= 4, 'Reserved frame height changed');
      assert(box.x >= -1 && box.x + box.width <= viewport.width + 1, 'Frame exceeds viewport edges');
      if (i === 1 || i === 9) await page.screenshot({ path: `${out}/${viewport.width}-figure-${i}.png` });
    }
    assert.equal(charts, 6); assert.equal(tables, 4);
    assert.equal(requested.size, expected.length, 'Scrolling did not request every document');
    const eagerControlRequests = await checkEagerControl(context);
    results.push({ viewport, initiallyRequested, eagerControlRequests, charts, tables });
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
