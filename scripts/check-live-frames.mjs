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
const browser = await chromium.launch();
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 393, height: 852 }]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    assert.equal(response.status(), 200);
    const frames = page.locator('iframe[src^="assets/"]');
    await frames.first().waitFor();
    assert.equal(await frames.count(), 10);
    for (let i = 0; i < expected.length; i++) {
      assert.equal(await frames.nth(i).getAttribute('loading'), 'lazy');
      assert.equal(await frames.nth(i).getAttribute('src'), expected[i].src);
      assert.equal(Number(await frames.nth(i).getAttribute('height')), expected[i].height);
    }
    const loadedInitially = page.frames().filter(frame => frame.url().includes('/assets/')).length;
    assert(loadedInitially < 10, `All ten frames eagerly loaded at ${viewport.width}px`);
    assert(!page.frames().some(frame => frame.url().endsWith(expected.at(-1).src)), 'Final figure loaded before scrolling');
    await page.screenshot({ path: `${out}/${viewport.width}-opening.png` });
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
      assert(box.width <= viewport.width, 'Frame exceeds viewport width');
      if (i === 1 || i === 9) await page.screenshot({ path: `${out}/${viewport.width}-figure-${i}.png` });
    }
    assert.equal(charts, 6); assert.equal(tables, 4);
    results.push({ viewport, loadedInitially, charts, tables });
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
