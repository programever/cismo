// Test of the whole page in a headless browser, against the real Firestore, with a throwaway key (never Iker's).
// It beats one craving, records one cigarette, checks the counts and the 30-day calendar, and deletes its records
// at the end. The clock is set to day 3 of the plan (14 November 2026), so the test works on any date.
// Haba is faked: the test checks that "I smoked" sends one "problem" mark, without writing to the real Haba.
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
    // Haba is faked here: "I smoked" marks "problem" in Haba, and the test must never touch Iker's real Haba.
    // Only Haba's records are faked; Cismo's own data still goes to the real database under the throwaway key.
    const habaWrites: string[] = [];
    await page.route(u => u.href.includes('/documents:runQuery') || u.href.includes('/documents/records'), async route => {
      const req = route.request();
      if (req.url().includes(':runQuery')) return route.fulfill({ json: [{ readTime: 'x' }] });
      habaWrites.push(req.postDataJSON().fields.item.stringValue);
      return route.fulfill({ json: {} });
    });
    await page.clock.setFixedTime(new Date('2026-11-18T10:00:00+07:00'));
    await page.goto(url + '#' + secret);
    await page.waitForFunction(() => document.querySelector('#counts')!.textContent!.includes('Tổng cộng'), null, { timeout: 20000 });
    assert.match(await page.locator('#since').innerText(), /Ngày 3 \/ 30[\s\S]*2 ngày 6 giờ/);
    assert.match(await page.locator('#today-head').innerText(), /Ngày 3/);
    assert.equal(await page.locator('#cal button').count(), 30);
    assert.equal(await page.locator('#cal .st-clean').count(), 2, 'day 1 and 2 without a cigarette');
    assert.equal(await page.locator('#cal .today').getAttribute('data-n'), '3');
    await page.click('#cal button[data-n="1"]');
    assert.match(await page.locator('#picked').innerText(), /Ngày 1 · Thứ Hai 16\/11[\s\S]*Không hút/);

    await page.click('#crave');
    assert.ok(await page.locator('#session').isVisible());
    await page.click('#s-stop');
    await page.click('#a-won');
    await page.click('#s-done');
    await page.waitForFunction(() => document.querySelector('#counts')!.textContent!.includes('thắng 1 cơn'), null, { timeout: 20000 });

    await page.click('#smoked');
    await page.click('#smoked-yes');
    await page.waitForFunction(() => document.querySelector('#since')!.textContent!.includes('0 phút'), null, { timeout: 20000 });
    assert.equal(await page.locator('#cal .st-smoked').getAttribute('data-n'), '3', 'today is orange now');
    assert.equal(await page.locator('#status').innerText(), 'Đã ghi lại.');
    for (let i = 0; i < 50 && !habaWrites.length; i++) await page.waitForTimeout(100);
    assert.deepEqual(habaWrites, ['problem']);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    server?.kill();
    // Delete the test records (the rules allow delete to whoever has the key).
    const list = await (await fetch(`${API}/cismo/${secret}/events?key=${KEY}`)).json() as { documents?: { name: string }[] };
    for (const d of list.documents ?? []) await fetch(`https://firestore.googleapis.com/v1/${d.name}?key=${KEY}`, { method: 'DELETE' });
  }
});
