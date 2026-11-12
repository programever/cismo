// Tests for src/plan.ts, the 30-day plan. Run: node --test test/plan.test.ts
process.env.TZ = 'Asia/Ho_Chi_Minh';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../src/plan.ts';
import type { Ev } from '../src/flow.ts';

test('30 days from Monday 16 November, one text for each day', () => {
  assert.equal(P.TEXTS.length, P.DAYS);
  assert.equal(P.DAYS, 30);
  for (const t of P.TEXTS) assert.ok(t.body && t.task, t.body);
  assert.equal(P.dayOf(1), '2026-11-16');
  assert.equal(P.dayOf(30), '2026-12-15');
  assert.equal(P.dayNumber('2026-11-16'), 1);
  assert.equal(P.dayNumber('2026-12-05'), 20);
  assert.equal(P.dayNumber('2026-11-15'), 0);
  assert.equal(P.dayName('2026-11-16'), 'Thứ Hai 16/11');
  assert.equal(P.dayName('2026-12-15'), 'Thứ Ba 15/12');
  assert.equal(P.dm(P.dayOf(30)), '15/12');
  assert.equal(P.weekday('2026-11-16'), 0, 'Monday');
  assert.equal(P.startTime().toISOString(), '2026-11-15T21:00:00.000Z', '04:00 Vietnam time');
  assert.deepEqual(P.TEXTS.map((t, i) => t.hard ? i + 1 : 0).filter(Boolean), [1, 2, 3, 4, 5, 6, 7], 'the first week is hard');
  assert.equal(P.textOf(0), P.TEXTS[0]);
  assert.equal(P.textOf(45), P.TEXTS[29], 'after the plan: the last text');
});

test('before the start: a countdown, every day still to come', () => {
  const now = new Date('2026-11-15T20:00:00+07:00');
  const p = P.progress([{ t: '2026-11-15T19:00:00+07:00', kind: 'smoked' }], now);
  assert.equal(p.n, 0);
  assert.equal(p.since, null);
  assert.equal(p.untilStart, 8 * 3600 * 1000);
  assert.equal(p.clean, 0);
  assert.equal(p.smokedDays, 0, 'a cigarette before day 1 is not in the plan');
  assert.ok(P.calendar([], now).every(c => c.state === 'future'));
  // 02:00 on 16 November still belongs to 15 November (a day starts at 04:00).
  assert.equal(P.progress([], new Date('2026-11-16T02:00:00+07:00')).n, 0);
});

test('during the plan: green days, orange days, the counter', () => {
  const now = new Date('2026-11-19T10:00:00+07:00');     // day 4
  const ev: Ev[] = [
    { t: '2026-11-16T09:00:00+07:00', kind: 'won' },
    { t: '2026-11-16T15:00:00+07:00', kind: 'won' },
    { t: '2026-11-17T21:00:00+07:00', kind: 'smoked' },
    { t: '2026-11-18T02:30:00+07:00', kind: 'won' },     // night: still 17 November
  ];
  const cal = P.calendar(ev, now);
  assert.equal(cal.length, 30);
  assert.deepEqual(cal.slice(0, 5).map(c => c.state), ['clean', 'smoked', 'clean', 'open', 'future']);
  assert.equal(cal[0]!.won, 2);
  assert.equal(cal[1]!.won, 1);
  assert.equal(cal[1]!.smoked, 1);
  assert.ok(cal[3]!.today && !cal[2]!.today);
  assert.deepEqual(cal.filter(c => c.prize).map(c => c.n), [1, 3, 7, 14, 21, 30]);
  const p = P.progress(ev, now);
  assert.equal(p.n, 4);
  assert.equal(p.clean, 2);
  assert.equal(p.smokedDays, 1);
  assert.equal(p.since, (24 + 13) * 3600 * 1000, 'since the cigarette on 17 November, 21:00');
  // No cigarette at all: the counter starts at 04:00 on day 1.
  assert.equal(P.progress([], now).since, (3 * 24 + 6) * 3600 * 1000);
  // A cigarette today makes today orange at once.
  const p2 = P.progress([...ev, { t: '2026-11-19T09:00:00+07:00', kind: 'smoked' }], now);
  assert.equal(p2.smokedDays, 2);
  assert.equal(p2.since, 3600 * 1000);
});
