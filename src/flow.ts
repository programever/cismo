// Cismo: help through a craving for a cigarette. The 5-minute session and the counting.
// No browser things in here, so it can be tested with node (see test/flow.test.ts).
//
// Iker asked for it on 2026-10-21: "when I crave a cigarette, the app must help me not smoke".
// A craving is strongest for a few minutes, then it fades. The session fills those minutes:
// slow breathing (2 minutes), a glass of water, moving (2 minutes), Iker's reasons. Then it asks: did it pass?
// Records are only counted, never judged: "I smoked" is written down and the counter starts again.
// Text only, no voice (Iker, 2026-10-21).

export type Phase = 'breathe' | 'water' | 'move' | 'reasons' | 'ask';

/** The steps of one session, with their start second. The session ends at SESSION_SEC with the question. */
export interface Step { phase: Phase; start: number; title: string; text: string }
export const STEPS: readonly Step[] = [
  { phase: 'breathe', start: 0, title: 'Thở chậm', text: 'Hít vào bằng mũi 4 giây. Thở ra bằng miệng thật chậm 6 giây. Vai thả lỏng.' },
  { phase: 'water', start: 125, title: 'Uống một ly nước', text: 'Uống chậm, từng ngụm. Nước lạnh càng tốt.' },
  { phase: 'move', start: 155, title: 'Vận động 2 phút', text: 'Lên xuống cầu thang, hoặc hít đất, hoặc đi bộ nhanh. Đi ra khỏi chỗ bạn hay hút thuốc.' },
  { phase: 'reasons', start: 275, title: 'Đọc lý do của bạn', text: 'Đọc chậm. Bấm "Lý do khác" để đọc thêm.' },
  { phase: 'ask', start: 300, title: 'Cơn thèm qua chưa?', text: '' },
];
export const SESSION_SEC = 300;
export const BREATHS = 12;          // 12 slow breaths of 10 seconds, after 5 seconds of intro
const IN_SEC = 4, OUT_SEC = 6;

/** What the breathing text says at second `sec` of the session: get ready, breathe in, or breathe out. */
export function breathAt(sec: number): 'ready' | 'in' | 'out' | null {
  if (sec < 5) return 'ready';
  const k = Math.floor((sec - 5) / (IN_SEC + OUT_SEC));
  if (k >= BREATHS) return null;
  return (sec - 5) % (IN_SEC + OUT_SEC) < IN_SEC ? 'in' : 'out';
}

/** The step that runs at second `sec` of the session. */
export function stepAt(sec: number): Step {
  let cur = STEPS[0]!;
  for (const s of STEPS) if (sec >= s.start) cur = s;
  return cur;
}

// ---------- records and counting ----------

/** won: a craving passed without smoking. smoked: Iker smoked. t looks like "2026-10-21T22:10:05+07:00". */
export type Kind = 'won' | 'smoked';
export interface Ev { t: string; kind: Kind }

function pad(n: number): string { return String(n).padStart(2, '0'); }

/** Local time with its offset, like Haba: "2026-10-21T22:10:05+07:00" (always 25 characters). */
export function isoLocal(d: Date): string {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;
}

/** A day starts at 04:00, like Haba: a craving at 01:00 counts for the day before. */
export function dayKey(d: Date): string {
  const x = new Date(d.getTime());
  x.setHours(x.getHours() - 4);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export interface Stats {
  /** Milliseconds since the last cigarette, or since the first record when there is none; null when there are no records. */
  since: number | null;
  /** true when `since` counts from a cigarette, false when it counts from the first record. */
  fromSmoke: boolean;
  wonToday: number;
  wonTotal: number;
  smokedToday: number;
}

export function stats(events: readonly Ev[], now: Date): Stats {
  const sorted = [...events].sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  const lastSmoke = [...sorted].reverse().find(e => e.kind === 'smoked');
  const from = lastSmoke ?? sorted[0];
  const today = dayKey(now);
  const isToday = (e: Ev): boolean => dayKey(new Date(e.t)) === today;
  return {
    since: from ? Math.max(0, now.getTime() - Date.parse(from.t)) : null,
    fromSmoke: !!lastSmoke,
    wonToday: sorted.filter(e => e.kind === 'won' && isToday(e)).length,
    wonTotal: sorted.filter(e => e.kind === 'won').length,
    smokedToday: sorted.filter(e => e.kind === 'smoked' && isToday(e)).length,
  };
}

/** 3 ngày 5 giờ, 5 giờ 20 phút, 20 phút. */
export function fmtSince(ms: number): string {
  const min = Math.floor(ms / 60000), h = Math.floor(min / 60), d = Math.floor(h / 24);
  if (d) return `${d} ngày ${h % 24} giờ`;
  if (h) return `${h} giờ ${min % 60} phút`;
  return `${min} phút`;
}

/** The secret part of Iker's link: letters and digits, at least 20 of them. The Firestore rules check the length. */
export function isKey(s: string): boolean { return /^[A-Za-z0-9]{20,64}$/.test(s); }
