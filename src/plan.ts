// Cismo: the 30-day plan (Iker, 2026-11-11: "tomorrow is my first day of quit smoking, our target is 30 days,
// it must help me to quit smoking every day, it needs a calendar").
// Day 1 is Thursday 12 November 2026. A day starts at 04:00, like Haba (see dayKey in flow.ts).
// Every day has its own short text: what happens in the body that day (with the source), and one small task.
// The calendar is made only from the records Iker already makes (craving beaten, I smoked), so the Firestore
// rules do not change. A day with a cigarette is orange; the plan never starts again from zero. Never judged.
// No browser things in here, so it can be tested with node (see test/plan.test.ts).

import { dayKey, type Ev } from './flow.ts';

export const START = '2026-11-12';
export const DAYS = 30;
/** Days with a prize picture on the calendar. */
export const PRIZES: readonly number[] = [1, 3, 7, 14, 21, 30];

const NHS = 'Bộ Y tế Anh (NHS)';

export interface DayText {
  title?: string;
  /** What happens in the body or in the head on this day. */
  body: string;
  /** Where the fact in `body` comes from, when it is a health fact. */
  from?: string;
  /** One small thing to do today. */
  task: string;
  /** A hard day: the page warns in the morning. */
  hard?: boolean;
}

/** One text per day, day 1 first. */
export const TEXTS: readonly DayText[] = [
  { title: 'Ngày đầu tiên', hard: true, from: NHS,
    body: '20 phút sau điếu thuốc cuối, nhịp tim đã bắt đầu về mức bình thường. Sau 8 giờ, oxy trong máu hồi phục và khí CO độc hại giảm một nửa.',
    task: 'Bỏ hết thuốc lá, bật lửa và gạt tàn ra khỏi nhà, xe và túi áo. Khi thèm, bấm nút xanh.' },
  { hard: true, from: NHS,
    body: 'Sau 48 giờ, toàn bộ khí CO đã ra khỏi máu. Phổi bắt đầu tự làm sạch. Vị giác và khứu giác tốt lên.',
    task: 'Mỗi ngày, bỏ số tiền bạn từng dùng mua thuốc vào một chỗ riêng. Ngày 30, dùng số tiền đó cho một thứ vui.' },
  { title: 'Ngày khó nhất', hard: true, from: NHS,
    body: 'Cơn thèm và sự bực bội thường mạnh nhất trong mấy ngày đầu, rồi giảm dần. Sau 72 giờ, thở dễ hơn vì phế quản bắt đầu giãn ra, và bạn có nhiều sức hơn.',
    task: 'Nghĩ trước: bạn hay hút lúc nào? Sau cà phê, sau bữa ăn, khi làm việc căng? Chọn sẵn một việc khác cho từng lúc đó.' },
  { hard: true,
    body: 'Bạn đã qua đỉnh của cơn thèm. Từ hôm nay, mỗi ngày thường nhẹ hơn hôm trước một chút.',
    task: 'Đổi chỗ uống cà phê buổi sáng, hoặc uống trà thay cà phê hôm nay.' },
  { hard: true, from: NHS,
    body: 'Khi bỏ thuốc, nhiều người thấy đói hơn và thèm ăn ngọt. Đó là chuyện bình thường.',
    task: 'Để sẵn đồ ăn nhẹ: trái cây, hạt, kẹo cao su không đường. Luôn có một chai nước bên cạnh.' },
  { hard: true, from: NHS,
    body: 'Trong vài tuần đầu, có thể khó ngủ hoặc ngủ không sâu. Điều này sẽ qua.',
    task: 'Tối nay tắt điện thoại sớm hơn 30 phút. Không uống cà phê sau 2 giờ chiều.' },
  { title: 'Một tuần', hard: true,
    body: 'Một tuần không thuốc lá. Tuần đầu là tuần khó nhất, và bạn đã đi qua nó.',
    task: 'Thưởng cho mình một thứ nhỏ bạn thích.' },
  { body: 'Phần lớn cơn thèm bây giờ đến từ thói quen: tay muốn cầm một thứ gì đó, miệng muốn có điếu thuốc.',
    task: 'Giữ trong tay một vật nhỏ: cây bút, hòn đá, chuỗi hạt. Khi tay muốn cầm điếu thuốc, cầm vật đó.' },
  { from: NHS,
    body: 'Nhiều người hút lại vì một suy nghĩ: "Chỉ một điếu thôi." Một điếu thường kéo theo điếu thứ hai.',
    task: 'Hôm nay giữ luật "không một hơi nào". Không một điếu, không một hơi.' },
  { from: NHS,
    body: 'Rượu bia làm cơn thèm thuốc mạnh hơn và làm mình dễ quên lời hứa với mình.',
    task: 'Tuần này tránh rượu bia, hoặc uống rất ít. Nếu đi nhậu, ngồi xa người hút.' },
  { from: NHS,
    body: 'Nhiều người nghĩ thuốc lá làm bớt căng thẳng. Thật ra nó chỉ làm dịu cơn thèm do chính nó gây ra. Sau khi bỏ, người ta thường bớt căng thẳng hơn.',
    task: 'Khi căng thẳng hôm nay, thở chậm 10 hơi: hít vào 4 giây, thở ra 6 giây.' },
  { body: 'Hơi thở, tóc, quần áo và nhà cửa không còn mùi khói thuốc.',
    task: 'Giặt áo khoác, lau chỗ bạn hay ngồi hút. Xoá mùi thuốc cuối cùng.' },
  { body: 'Vận động ngắn, như đi bộ nhanh vài phút, làm cơn thèm yếu đi.',
    task: 'Hôm nay chạy hoặc đi bộ nhanh 20 phút. Để ý hơi thở của bạn.' },
  { title: 'Hai tuần', from: NHS,
    body: 'Từ tuần thứ 2 đến tuần thứ 12, máu lưu thông tốt hơn đến tim và cơ bắp. Chạy bộ và leo dốc sẽ dễ hơn.',
    task: 'Viết ra 3 điều tốt bạn thấy sau 2 tuần không hút.' },
  { body: 'Đã qua một nửa. Cơn thèm bây giờ thường ít hơn và ngắn hơn, nhưng đôi khi vẫn đến bất ngờ.',
    task: 'Nếu cơn thèm đến bất ngờ, đừng sợ. Bấm nút, 5 phút là qua.' },
  { body: 'Cơn thèm thường đến ở cùng một chỗ, cùng một giờ, hoặc với cùng một người.',
    task: 'Hôm nay để ý: cơn thèm đến lúc nào, ở đâu? Lần sau tránh chỗ đó hoặc đổi việc làm ở đó.' },
  { from: NHS,
    body: 'Vị giác và khứu giác đã tốt hơn nhiều. Đồ ăn ngon hơn.',
    task: 'Ăn chậm một bữa hôm nay. Để ý mùi và vị của từng món.' },
  { body: 'Bạn đã không hút 17 ngày. Những người bên cạnh bạn cũng được thở không khí sạch hơn.',
    task: 'Kể cho một người bạn tin: "Tôi đã không hút thuốc được hơn 2 tuần."' },
  { from: NHS,
    body: 'Tâm trạng có thể lên xuống. Buồn hoặc bực một chút trong mấy tuần đầu là bình thường, và sẽ qua.',
    task: 'Làm một việc làm bạn vui: gọi cho bạn bè, nghe nhạc, ra ngoài trời.' },
  { body: 'Giấc ngủ thường tốt hơn khi những khó chịu của việc cai thuốc qua đi.',
    task: 'Đi ngủ đúng giờ tối nay.' },
  { title: 'Ba tuần', from: NHS,
    body: 'Phần lớn những khó chịu khi cai thuốc thường giảm rõ sau 2 đến 4 tuần.',
    task: 'Nghĩ thêm một lý do mới của riêng bạn. Nói với Alpha để thêm vào Cismo.' },
  { body: 'Bây giờ bạn là người không hút thuốc. Hãy nói câu đó: "Tôi không hút thuốc."',
    task: 'Khi ai mời thuốc, nói: "Cảm ơn, tôi không hút." Không cần giải thích thêm.' },
  { body: 'Một cơn thèm chỉ là một cảm giác. Nó đến, rồi nó đi, như mây trên trời.',
    task: 'Khi thèm, ngồi yên và nhìn cơn thèm như nhìn một đám mây. Đếm 10 hơi thở.' },
  { body: 'Những lúc vui, như tiệc hay đi chơi, cũng có thể làm thèm thuốc.',
    task: 'Nếu hôm nay có tiệc, cầm sẵn một ly nước trong tay, và đứng cùng người không hút.' },
  { body: 'Lúc dễ hút lại nhất bây giờ là khi nghĩ: "Mình đã bỏ được rồi, một điếu không sao."',
    task: 'Nhắc lại luật: không một hơi nào.' },
  { from: NHS,
    body: 'Phổi tiếp tục tốt lên trong nhiều tháng. Sau 3 đến 9 tháng, ho và khó thở giảm, sức của phổi tăng tới 10%.',
    task: 'Chạy bộ hoặc leo cầu thang hôm nay. Mỗi hơi thở là của bạn.' },
  { body: 'Thói quen mới đang mạnh lên mỗi ngày.',
    task: 'Nghĩ xem: bây giờ sau bữa ăn bạn làm gì thay vì hút? Giữ việc đó.' },
  { from: NHS,
    body: 'Người không hút được 28 ngày có khả năng bỏ hẳn cao gấp 5 lần.',
    task: 'Chỉ còn 2 ngày. Cứ làm như hôm qua.' },
  { from: NHS,
    body: 'Sau 1 năm không hút, nguy cơ đau tim chỉ còn một nửa so với người hút.',
    task: 'Đếm số tiền đã để dành. Chọn thứ bạn sẽ mua ngày mai.' },
  { title: '30 ngày',
    body: 'Bạn đã đi hết 30 ngày. Đây không phải là cuối đường, mà là đầu của một cuộc sống không khói thuốc.',
    task: 'Dùng số tiền để dành cho một thứ vui. Cismo vẫn ở đây mỗi khi bạn thèm.' },
];

function pad(n: number): string { return String(n).padStart(2, '0'); }
function utcOf(day: string): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y!, m! - 1, d!);
}

/** Day 1 starts at 04:00 on START, phone time. */
export function startTime(): Date {
  const [y, m, d] = START.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 4, 0, 0);
}

/** The plan day of a day key: 1 for START, 0 the day before, 31 the day after the plan. */
export function dayNumber(day: string): number { return Math.round((utcOf(day) - utcOf(START)) / 86400000) + 1; }

/** The day key of plan day n. */
export function dayOf(n: number): string {
  const x = new Date(utcOf(START) + (n - 1) * 86400000);
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
}

/** 0 = Monday … 6 = Sunday. */
export function weekday(day: string): number { return (new Date(utcOf(day)).getUTCDay() + 6) % 7; }

export const WEEKDAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
export const WEEKDAYS_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** "Thứ Năm 12/11" */
export function dayName(day: string): string {
  const [, m, d] = day.split('-').map(Number);
  return `${WEEKDAYS[weekday(day)]} ${d}/${m}`;
}

/** clean: no cigarette that day. smoked: at least one. open: today, no cigarette yet. future: not come yet. */
export type CellState = 'clean' | 'smoked' | 'open' | 'future';
export interface Cell { n: number; day: string; state: CellState; today: boolean; won: number; smoked: number; prize: boolean }

/** The 30 days of the plan, with what happened on each. */
export function calendar(events: readonly Ev[], now: Date): Cell[] {
  const today = dayKey(now);
  const won = new Map<string, number>(), smoked = new Map<string, number>();
  for (const e of events) {
    const k = dayKey(new Date(e.t));
    const m = e.kind === 'won' ? won : smoked;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  const cells: Cell[] = [];
  for (let n = 1; n <= DAYS; n++) {
    const day = dayOf(n);
    const s = smoked.get(day) ?? 0;
    const state: CellState = day > today ? 'future' : s ? 'smoked' : day === today ? 'open' : 'clean';
    cells.push({ n, day, state, today: day === today, won: won.get(day) ?? 0, smoked: s, prize: PRIZES.includes(n) });
  }
  return cells;
}

export interface Progress {
  /** Today's plan day: 0 or less before the start, 1 to 30 during the plan, more after it. */
  n: number;
  /** Milliseconds until day 1 starts (only before the start). */
  untilStart: number;
  /** Milliseconds since the last cigarette, counted from the start of day 1 at the earliest; null before the start. */
  since: number | null;
  /** Finished days without a cigarette, and days with one. Today counts when it already has a cigarette. */
  clean: number;
  smokedDays: number;
}

export function progress(events: readonly Ev[], now: Date): Progress {
  const n = dayNumber(dayKey(now));
  const start = startTime().getTime();
  const lastSmoke = Math.max(start, ...events.filter(e => e.kind === 'smoked').map(e => Date.parse(e.t)));
  const cells = calendar(events, now);
  return {
    n,
    untilStart: Math.max(0, start - now.getTime()),
    since: now.getTime() < start ? null : Math.max(0, now.getTime() - lastSmoke),
    clean: cells.filter(c => c.state === 'clean').length,
    smokedDays: cells.filter(c => c.state === 'smoked').length,
  };
}

/** The text for plan day n; after the plan, the last day's text. */
export function textOf(n: number): DayText { return TEXTS[Math.min(Math.max(n, 1), DAYS) - 1]!; }
