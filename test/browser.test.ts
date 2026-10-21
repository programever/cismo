// Test of the whole page in a headless browser, against the real Firestore, with a throwaway key (never Iker's).
// It beats one craving, records one cigarette, checks the counts, and deletes its records at the end.
// Build first (npm run build), then: npm run test:browser
// To test the live site instead: CISMO_URL=https://programever.github.io/cismo/ npm run test:browser
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { chromium } from 'playwright';

const API = 'https://firestore.googleapis.com/v1/projects/habits-433f8/databases/(default)/documents';
const KEY = 'AIzaSyDtkJvnZLPIkIAJzj9w3F486bX2E8T5kuU';

test('a craving session is saved and counted', async () => {
  const secret = 'Test' + randomBytes(16).toString('hex');
  let url = process.env['CISMO_URL'];
  let server: ChildProcess | null = null;
  if (!url) {
    server = spawn('python3', ['-m', 'http.server', '8768', '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' });
    await new Promise(r => setTimeout(r, 800));
    url = 'http://127.0.0.1:8768/index.html';
  }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Ho_Chi_Minh' });
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url + '#' + secret);
    await page.waitForFunction(() => document.querySelector('#counts')!.textContent!.includes('Tổng cộng'), null, { timeout: 20000 });
    assert.match(await page.locator('#since').innerText(), /ngày đầu tiên/);

    await page.click('#crave');
    assert.ok(await page.locator('#session').isVisible());
    await page.click('#s-stop');
    await page.click('#a-won');
    await page.click('#s-done');
    await page.waitForFunction(() => document.querySelector('#counts')!.textContent!.includes('thắng 1 cơn'), null, { timeout: 20000 });

    await page.click('#smoked');
    await page.click('#smoked-yes');
    await page.waitForFunction(() => document.querySelector('#since')!.textContent!.includes('Không hút thuốc đã'), null, { timeout: 20000 });
    assert.equal(await page.locator('#status').innerText(), 'Đã ghi lại.');
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    server?.kill();
    // Delete the test records (the rules allow delete to whoever has the key).
    const list = await (await fetch(`${API}/cismo/${secret}/events?key=${KEY}`)).json() as { documents?: { name: string }[] };
    for (const d of list.documents ?? []) await fetch(`https://firestore.googleapis.com/v1/${d.name}?key=${KEY}`, { method: 'DELETE' });
  }
});
