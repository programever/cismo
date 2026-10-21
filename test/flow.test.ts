// Tests for src/flow.ts. Run: node --test test/flow.test.ts
process.env.TZ = 'Asia/Ho_Chi_Minh';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as F from '../src/flow.ts';
import * as R from '../src/reasons.ts';

test('the 5-minute session', () => {
  assert.deepEqual(F.STEPS.map(s => s.phase), ['breathe', 'water', 'move', 'reasons', 'ask']);
  assert.equal(F.SESSION_SEC, 300);
  assert.equal(F.STEPS.at(-1)?.start, F.SESSION_SEC, 'the question comes at 5 minutes');
  assert.equal(F.stepAt(0).phase, 'breathe');
  assert.equal(F.stepAt(124.9).phase, 'breathe', '2 minutes of slow breathing after the first 5 seconds');
  assert.equal(F.stepAt(125).phase, 'water');
  assert.equal(F.stepAt(155).phase, 'move');
  assert.equal(F.stepAt(275).phase, 'reasons');
  assert.equal(F.STEPS[2]!.start - F.STEPS[1]!.start, 30, '30 seconds for water');
  assert.equal(F.STEPS[3]!.start - F.STEPS[2]!.start, 120, '2 minutes of moving');
});

test('breathing: 4 seconds in, 6 seconds out, 12 times', () => {
  assert.equal(F.breathAt(0), 'ready');
  assert.equal(F.breathAt(5), 'in');
  assert.equal(F.breathAt(8.9), 'in');
  assert.equal(F.breathAt(9), 'out');
  assert.equal(F.breathAt(14.9), 'out');
  assert.equal(F.breathAt(15), 'in');
  assert.equal(F.breathAt(5 + 12 * 10 - 0.1), 'out', 'last breath');
  assert.equal(F.breathAt(125), null, 'breathing is over');
});

test('counting: time without smoking and cravings beaten', () => {
  const now = new Date('2026-10-23T20:00:00+07:00');
  assert.deepEqual(F.stats([], now), { since: null, fromSmoke: false, wonToday: 0, wonTotal: 0, smokedToday: 0 });
  const ev: F.Ev[] = [
    { t: '2026-10-21T21:00:00+07:00', kind: 'won' },
    { t: '2026-10-22T09:00:00+07:00', kind: 'smoked' },
    { t: '2026-10-23T02:00:00+07:00', kind: 'won' },   // 02:00 counts for 22 Oct (the 04:00 rule)
    { t: '2026-10-23T12:00:00+07:00', kind: 'won' },
    { t: '2026-10-23T18:00:00+07:00', kind: 'won' },
  ];
  const s = F.stats(ev, now);
  assert.equal(s.since, (24 + 11) * 3600 * 1000, 'since the last cigarette, 22 Oct 09:00');
  assert.equal(s.fromSmoke, true);
  assert.equal(s.wonToday, 2);
  assert.equal(s.wonTotal, 4);
  assert.equal(F.stats(ev.filter(e => e.kind === 'won'), now).fromSmoke, false, 'no cigarette yet: count from the first record');
  assert.equal(F.fmtSince(35 * 3600 * 1000), '1 ngày 11 giờ');
  assert.equal(F.fmtSince(80 * 60 * 1000), '1 giờ 20 phút');
  assert.equal(F.fmtSince(59 * 1000), '0 phút');
});

test('time format and key', () => {
  const t = F.isoLocal(new Date('2026-10-21T15:04:05+07:00'));
  assert.equal(t, '2026-10-21T15:04:05+07:00');
  assert.equal(t.length, 25, 'the Firestore rules ask for 25 characters');
  assert.ok(F.isKey('abcDEF0123456789ghijKLMN'));
  assert.ok(!F.isKey('short'));
  assert.ok(!F.isKey('abcDEF0123456789ghij-KLMN'), 'letters and digits only');
});

test('reasons: many, every kind has a picture, random without quick repeats', () => {
  assert.ok(R.GENERAL.length >= 30, 'many reasons');
  for (const r of R.GENERAL) assert.ok(r.text && R.PICTURES[r.kind], r.text);
  assert.equal(new Set(R.GENERAL.map(r => r.text)).size, R.GENERAL.length, 'no reason twice');
  assert.equal(R.kindOf('Ngày 27/12 bạn sẽ leo 4000m ở Núi Dinh.'), 'race');
  assert.equal(R.kindOf('Con bạn đang lớn và đang nhìn bạn.'), 'family');
  assert.equal(R.kindOf('Bạn muốn có thật nhiều năm khỏe mạnh bên vợ và con.'), 'family');
  assert.equal(R.kindOf('Cơn thèm chỉ mạnh trong vài phút.'), 'self', '"cơn" is not "con"');
  let seed = 7;
  const rnd = (): number => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const items = ['a', 'b', 'c', 'd', 'e'];
  const next = R.makeBag(items, rnd);
  const seen: string[] = [];
  for (let i = 0; i < 50; i++) seen.push(next()!);
  for (let r = 0; r < 10; r++) assert.deepEqual([...seen.slice(r * 5, r * 5 + 5)].sort(), items, 'each reason once per round');
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i], seen[i - 1], 'never the same reason twice in a row');
  assert.equal(R.makeBag([])(), undefined);
});
