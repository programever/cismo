// Cismo page. Home: the 30-day plan (day n of 30, today's text, a calendar, see plan.ts), how long without a
// cigarette, cravings beaten, one big "I crave a cigarette" button, Iker's reasons.
// The button opens a 5-minute session (see flow.ts): slow breathing, water, moving, reasons, then "did it pass?".
// Text only, no voice (Iker, 2026-10-21).
//
// Data lives in Firestore (Google), the same project as Haba and Trani, under a secret key:
//   cismo/{key}/events/{id}  = {t: "2026-10-21T22:10:05+07:00", kind: "won" | "smoked"}
//   cismo/{key}/reasons/{id} = {text: "...", n: 1}   (Iker's personal reasons, written by Alpha)
// Reasons are shown one at a time in random order: the personal ones and the general ones in reasons.ts.
// The key is the part after # in Iker's link. It is never in this code. Without it nobody can read the data.

import { initializeApp } from 'firebase/app';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, addDoc, onSnapshot, type Firestore,
} from 'firebase/firestore';
import * as F from './flow.ts';
import * as P from './plan.ts';
import { GENERAL, kindOf, makeBag, PICTURES, type Reason } from './reasons.ts';
import { markHaba } from './haba-mark.ts';

const firebaseConfig = {
  apiKey: 'AIzaSyDtkJvnZLPIkIAJzj9w3F486bX2E8T5kuU',
  authDomain: 'habits-433f8.firebaseapp.com',
  projectId: 'habits-433f8',
  storageBucket: 'habits-433f8.firebasestorage.app',
  messagingSenderId: '632547558396',
  appId: '1:632547558396:web:5bdf411d492236c5686879',
};

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error('missing element #' + id);
  return el;
}
function esc(s: unknown): string {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}
function setStatus(msg: string, err = false): void {
  const el = $('status');
  el.textContent = msg;
  el.className = 'status' + (err ? ' err' : '');
}

/** The key from the link (#KEY), remembered on this phone so the home-screen icon works without it. */
function findKey(): string | null {
  const fromLink = location.hash.slice(1);
  try {
    if (F.isKey(fromLink)) { localStorage.setItem('cismo-key', fromLink); return fromLink; }
    const kept = localStorage.getItem('cismo-key') ?? '';
    if (F.isKey(kept)) return kept;
  } catch { /* no storage: only the link works */ }
  return F.isKey(fromLink) ? fromLink : null;
}

const state = {
  events: [] as F.Ev[],
  personal: [] as Reason[],
  loaded: false,
};

// ---------- reasons ----------
function allReasons(): Reason[] { return [...state.personal, ...GENERAL]; }
let nextReason = makeBag(allReasons());
let shown: Reason | undefined;

function card(r: Reason | undefined): string {
  if (!r) return '';
  return `<div class="card k-${r.kind}"><svg class="pic" viewBox="0 0 48 48" aria-hidden="true">${PICTURES[r.kind]}</svg>` +
    `<div class="words"><p class="rt">${esc(r.text)}</p>${r.from ? `<p class="rf">— ${esc(r.from)}</p>` : ''}</div></div>`;
}
function showReason(where: 'reason-card' | 's-reason-card'): void { shown = nextReason(); $(where).innerHTML = card(shown); }

// ---------- home ----------
const STAR = '<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5-6.5 4.5 2-7.5L2 9h7z"/></svg>';
let picked = 0;   // the calendar day Iker tapped, 0 = none

/** One day's text: what happens, where the fact comes from, and today's small task. */
function dayText(n: number): string {
  const t = P.textOf(n);
  return (t.hard && n <= P.DAYS ? '<p class="hard">Đây là ngày khó. Cơn thèm có thể mạnh. Bấm nút xanh bất cứ lúc nào.</p>' : '') +
    `<div class="day"><p class="body">${esc(t.body)}</p>${t.from ? `<p class="rf">— ${esc(t.from)}</p>` : ''}` +
    `<p class="task"><b>Việc nên làm:</b> ${esc(t.task)}</p></div>`;
}

function cellWords(c: P.Cell): string {
  const won = c.won ? ` Thắng ${c.won} cơn thèm.` : '';
  if (c.state === 'future') return 'Chưa đến.';
  if (c.state === 'smoked') return `Có hút (${c.smoked} lần). Đã ghi lại, không sao. Ngày mới bắt đầu lại.` + won;
  if (c.state === 'open') return 'Hôm nay, chưa hút điếu nào.' + won;
  return 'Không hút.' + won;
}

function renderPlan(now: Date): void {
  const p = P.progress(state.events, now);
  const cells = P.calendar(state.events, now);

  // Top: which day, and how long without smoking.
  $('since').innerHTML = !state.loaded ? '<span class="muted">Đang tải…</span>'
    : p.n < 1 ? `<span>Ngày 1 bắt đầu sau</span><b>${esc(F.fmtSince(p.untilStart))}</b>` +
      `<span>Lúc 4 giờ sáng, ${esc(P.dayName(P.START))}. Mục tiêu: 30 ngày không hút thuốc.</span>`
    : (p.n <= P.DAYS ? `<span class="dayno">Ngày ${p.n} / ${P.DAYS}</span>` : `<span class="dayno">Đã xong 30 ngày</span>`) +
      `<span>Không hút thuốc đã</span><b>${esc(F.fmtSince(p.since ?? 0))}</b>`;
  ($('bar-fill') as HTMLElement).style.width = `${Math.min(100, Math.max(0, p.n) / P.DAYS * 100)}%`;
  $('bar').hidden = !state.loaded;

  // Today's text. Before the start: day 1's text, so Iker can read it before ("Ngày mai" only on the evening before).
  $('today-head').textContent = p.n < 1 ? `${p.n === 0 ? 'Ngày mai' : P.dayName(P.START)} · Ngày 1` :p.n <= P.DAYS ? `Hôm nay · Ngày ${p.n}` + (P.textOf(p.n).title ? ` · ${P.textOf(p.n).title}` : '') : 'Sau 30 ngày';
  $('today').innerHTML = dayText(p.n);

  // The calendar, Monday to Sunday.
  $('cal-sum').textContent = p.n < 1 ? `Từ ${P.dm(P.dayOf(1))} đến ${P.dm(P.dayOf(P.DAYS))}. Bấm vào một ngày để xem.`
    : `${p.clean} ngày không hút` + (p.smokedDays ? `, ${p.smokedDays} ngày có hút` : '') + '. Bấm vào một ngày để xem.';
  const lead = P.weekday(P.START);
  let html = P.WEEKDAYS_SHORT.map(w => `<span class="wd">${w}</span>`).join('') + '<span></span>'.repeat(lead);
  for (const c of cells) {
    const [, m, d] = c.day.split('-').map(Number);
    const month = c.n === 1 || d === 1 ? `<span class="mo">Th${m}</span>` : '';
    html += `<button type="button" class="c st-${c.state}${c.today ? ' today' : ''}${picked === c.n ? ' picked' : ''}" data-n="${c.n}" ` +
      `aria-label="Ngày ${c.n}, ${esc(P.dayName(c.day))}. ${esc(cellWords(c))}">` +
      `${month}<span class="d">${d}</span>${c.prize ? STAR : ''}${c.won ? `<span class="w">✓${c.won}</span>` : ''}</button>`;
  }
  $('cal').innerHTML = html;

  const c = cells[picked - 1];
  $('picked').hidden = !c;
  if (c) {
    const t = P.textOf(c.n);
    $('picked').innerHTML = `<h3>Ngày ${c.n} · ${esc(P.dayName(c.day))}${t.title ? ` · ${esc(t.title)}` : ''}</h3>` +
      `<p class="state">${esc(cellWords(c))}</p>` + dayText(c.n);
  }
}

function renderHome(): void {
  const now = new Date();
  renderPlan(now);
  const s = F.stats(state.events, now);
  $('counts').textContent = state.loaded
    ? `Hôm nay đã thắng ${s.wonToday} cơn thèm. Tổng cộng: ${s.wonTotal}.` : '';
  const all = allReasons();
  $('reason-count').textContent = String(all.length);
  $('reasons').innerHTML = all.map(r => `<li>${esc(r.text)}${r.from ? ` <span class="rf">— ${esc(r.from)}</span>` : ''}</li>`).join('');
  if (!$('reason-card').innerHTML) showReason('reason-card');
}

// ---------- session ----------
const session = { t0: 0, offset: 0, timer: 0, reasonAt: 0 };
let wake: WakeLockSentinel | null = null;

async function keepAwake(on: boolean): Promise<void> {
  try {
    if (on && !wake && 'wakeLock' in navigator) {
      wake = await navigator.wakeLock.request('screen');
      wake.addEventListener('release', () => { wake = null; });
    } else if (!on && wake) {
      await wake.release();
      wake = null;
    }
  } catch { /* not allowed here: the screen may turn off by itself */ }
}

function sec(): number { return (Date.now() - session.t0) / 1000 + session.offset; }

function mmss(s: number): string {
  const v = Math.max(0, Math.ceil(s));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
}

function startSession(): void {
  session.t0 = Date.now();
  session.offset = 0;
  session.reasonAt = 0;
  showReason('s-reason-card');
  $('session').hidden = false;
  $('s-run').hidden = false;
  $('s-ask').hidden = true;
  $('s-done').hidden = true;
  document.body.classList.add('in-session');
  void keepAwake(true);
  window.clearInterval(session.timer);
  session.timer = window.setInterval(tick, 250);
  tick();
}

function tick(): void {
  const t = sec();
  if (t >= F.SESSION_SEC) { ask(); return; }
  const step = F.stepAt(t);
  const i = F.STEPS.indexOf(step);
  const next = F.STEPS[i + 1];
  $('s-step').textContent = `Bước ${i + 1}/4`;
  $('s-left').textContent = `Còn ${mmss(F.SESSION_SEC - t)}`;
  $('s-title').textContent = step.title + (next ? ` · ${mmss(next.start - t)}` : '');
  $('s-text').textContent = step.text;

  const b = step.phase === 'breathe' ? F.breathAt(t) : null;
  $('breath').hidden = !b;
  if (b) {
    $('breath-text').textContent = b === 'ready' ? 'Chuẩn bị' : b === 'in' ? 'Hít vào' : 'Thở ra';
    $('circle').className = 'circle ' + b;
  }

  // A new random reason every 20 seconds, or at once with the button.
  if (t - session.reasonAt >= 20) { session.reasonAt = t; showReason('s-reason-card'); }
  $('s-reason').hidden = false;
}

function ask(): void {
  window.clearInterval(session.timer);
  $('s-step').textContent = '';
  $('s-left').textContent = '';
  $('s-title').textContent = 'Cơn thèm qua chưa?';
  $('s-text').textContent = 'Chọn một. Không có câu trả lời sai.';
  $('breath').hidden = true;
  $('s-run').hidden = true;
  $('s-ask').hidden = false;
}

function nextStep(): void {
  const t = sec();
  const next = F.STEPS.find(s => s.start > t);
  session.offset += (next ? next.start : F.SESSION_SEC) - t;
  tick();
}

function endSession(message: string): void {
  window.clearInterval(session.timer);
  void keepAwake(false);
  $('s-ask').hidden = true;
  $('s-run').hidden = true;
  $('breath').hidden = true;
  $('s-reason').hidden = true;
  if (!message) { closeSession(); return; }
  $('s-title').textContent = message;
  $('s-text').textContent = '';
  $('s-done').hidden = false;
  $('s-done').textContent = 'Về màn hình chính';
}

function closeSession(): void {
  window.clearInterval(session.timer);
  void keepAwake(false);
  $('session').hidden = true;
  document.body.classList.remove('in-session');
}

// ---------- start ----------
function init(): void {
  const key = findKey();
  if (!key) { $('nokey').hidden = false; return; }
  $('home').hidden = false;
  renderHome();

  const app = initializeApp(firebaseConfig);
  let db: Firestore;
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    db = initializeFirestore(app, {});
  }
  const events = collection(db, 'cismo', key, 'events');
  const reasons = collection(db, 'cismo', key, 'reasons');
  const record = (kind: F.Kind): void => {
    addDoc(events, { t: F.isoLocal(new Date()), kind }).catch((e: Error) => setStatus('Không lưu được: ' + e.message, true));
    // "I smoked" also marks "Problem" in Haba, once per day (Iker, 2026-10-21). Only written down, never judged.
    if (kind === 'smoked') {
      markHaba('problem').catch(() => setStatus('Đã ghi lại, nhưng không ghi được vào Haba.', true));
    }
  };

  onSnapshot(events, snap => {
    state.events = snap.docs.map(d => ({ t: String(d.get('t') ?? ''), kind: d.get('kind') === 'smoked' ? 'smoked' : 'won' }));
    state.loaded = true;
    // Clear only an old error; a short "recorded" message stays until its own timer clears it.
    if (snap.metadata.fromCache && !navigator.onLine) setStatus('Mất mạng. Đang xem bản lưu trên điện thoại.', true);
    else if ($('status').classList.contains('err')) setStatus('');
    renderHome();
  }, err => setStatus('Không đọc được dữ liệu: ' + err.message, true));
  onSnapshot(reasons, snap => {
    state.personal = snap.docs.map(d => ({ n: Number(d.get('n') ?? 0), text: String(d.get('text') ?? '') }))
      .filter(r => r.text).sort((a, b) => a.n - b.n).map(r => ({ text: r.text, kind: kindOf(r.text) }));
    nextReason = makeBag(allReasons(), Math.random, shown);
    renderHome();
  }, () => { /* the events listener already shows the error */ });

  $('crave').addEventListener('click', startSession);
  $('cal').addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button[data-n]');
    if (!b) return;
    const n = Number(b.dataset['n']);
    picked = picked === n ? 0 : n;
    renderHome();
    if (picked) $('picked').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $('reason-next').addEventListener('click', () => showReason('reason-card'));
  $('s-reason-next').addEventListener('click', () => { session.reasonAt = sec(); showReason('s-reason-card'); });
  $('s-next').addEventListener('click', nextStep);
  $('s-stop').addEventListener('click', ask);
  $('a-won').addEventListener('click', () => { record('won'); endSession('Giỏi lắm. Bạn đã thắng cơn thèm này.'); });
  $('a-more').addEventListener('click', startSession);
  $('a-smoked').addEventListener('click', () => { record('smoked'); endSession('Đã ghi lại. Bắt đầu lại từ bây giờ.'); });
  $('a-close').addEventListener('click', closeSession);
  $('s-done').addEventListener('click', closeSession);

  $('smoked').addEventListener('click', () => { $('smoked-confirm').hidden = false; });
  $('smoked-no').addEventListener('click', () => { $('smoked-confirm').hidden = true; });
  $('smoked-yes').addEventListener('click', () => {
    record('smoked');
    $('smoked-confirm').hidden = true;
    setStatus('Đã ghi lại.');
    window.setTimeout(() => { if ($('status').textContent === 'Đã ghi lại.') setStatus(''); }, 4000);
  });

  // The time without smoking grows: draw again every minute, and when the page comes back.
  window.setInterval(renderHome, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    renderHome();
    if (!$('session').hidden && !$('s-run').hidden) void keepAwake(true);
  });
}

init();
