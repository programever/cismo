// Reasons not to smoke, shown one at a time in random order, each with a small picture (Iker, 2026-10-21:
// "random, many, quotes, pictures, and a button for another one").
// Two sources: the general reasons below (public, nothing personal), and Iker's personal reasons, which Alpha
// wrote into Firestore under the secret key (they talk about Iker's family and race, so they are not in this code).
// No browser things in here, so it can be tested with node.

export type Kind = 'health' | 'race' | 'family' | 'self' | 'breath' | 'quote';
export interface Reason { text: string; kind: Kind; from?: string }

const WHO = 'Tổ chức Y tế Thế giới (WHO)';
const NHS = 'Bộ Y tế Anh (NHS)';
const CDC = 'Trung tâm Kiểm soát Bệnh tật Mỹ (CDC)';
const LAO = 'Lão Tử, Đạo Đức Kinh';
const TNH = 'Thiền sư Thích Nhất Hạnh';
const PROVERB = 'Tục ngữ Việt Nam';

export const GENERAL: readonly Reason[] = [
  // Health: what happens after the last cigarette, with the source.
  { kind: 'health', from: WHO, text: 'Chỉ 20 phút sau điếu thuốc cuối, nhịp tim và huyết áp đã bắt đầu giảm.' },
  { kind: 'health', from: WHO, text: 'Sau 12 giờ, lượng khí CO trong máu giảm về mức bình thường.' },
  { kind: 'health', from: NHS, text: 'Sau 48 giờ, vị giác và khứu giác bắt đầu tốt lên. Đồ ăn sẽ ngon hơn.' },
  { kind: 'health', from: NHS, text: 'Sau 72 giờ, thở dễ hơn và bạn thấy có nhiều sức hơn.' },
  { kind: 'health', from: WHO, text: 'Sau 2 đến 12 tuần, máu lưu thông tốt hơn và phổi làm việc tốt hơn.' },
  { kind: 'health', from: NHS, text: 'Sau 3 đến 9 tháng, sức của phổi tăng tới 10%.' },
  { kind: 'health', from: WHO, text: 'Sau 1 đến 9 tháng, ho và khó thở giảm đi.' },
  { kind: 'health', from: WHO, text: 'Sau 1 năm, nguy cơ bệnh tim mạch vành chỉ còn khoảng một nửa so với người hút.' },
  { kind: 'health', from: WHO, text: 'Sau 10 năm, nguy cơ chết vì ung thư phổi chỉ còn khoảng một nửa so với người hút.' },
  { kind: 'health', from: CDC, text: 'Khói thuốc lá có hơn 7.000 chất hóa học. Ít nhất 69 chất trong đó gây ung thư.' },
  { kind: 'health', from: 'Nghiên cứu trên tạp chí y khoa NEJM, 2013',
    text: 'Người bỏ thuốc ở tuổi 35 đến 44 sống thêm khoảng 9 năm so với người tiếp tục hút.' },
  { kind: 'family', from: CDC, text: 'Khói thuốc thụ động làm trẻ em dễ bị hen suyễn, viêm phổi và viêm tai hơn.' },
  // Race and running.
  { kind: 'race', text: 'Khí CO trong khói thuốc chiếm chỗ của oxy trong máu. Vì vậy người hút thuốc mau mệt hơn khi leo dốc.' },
  { kind: 'race', text: 'Mỗi điếu không hút là thêm một chút oxy cho con dốc cuối ở Núi Dinh.' },
  { kind: 'race', text: '4000 mét leo cần một đôi phổi sạch.' },
  { kind: 'race', text: 'Ở km 50, bạn sẽ cần từng hơi thở.' },
  { kind: 'race', text: 'Hôm nay không hút, ngày mai leo cầu thang nhẹ hơn.' },
  { kind: 'race', from: PROVERB, text: 'Đường dài mới biết ngựa hay.' },
  // Family.
  { kind: 'family', text: 'Con học theo những gì bạn làm, không phải những gì bạn nói.' },
  { kind: 'family', text: 'Một cái ôm con không có mùi thuốc lá.' },
  { kind: 'family', text: 'Mỗi năm sống khỏe là thêm một năm bên những người bạn thương.' },
  { kind: 'family', text: 'Tiền mua thuốc lá có thể thành một đôi giày chạy mới, hoặc một món quà cho con.' },
  // You and the craving.
  { kind: 'self', text: 'Thèm chỉ là một cảm giác, không phải một mệnh lệnh.' },
  { kind: 'self', text: 'Bạn không cần bỏ thuốc cả đời ngay hôm nay. Chỉ cần thắng cơn thèm này.' },
  { kind: 'self', text: 'Cơn thèm giống như sóng: lên cao, rồi xuống. Bạn chỉ cần đứng vững cho nó đi qua.' },
  { kind: 'self', text: 'Mỗi lần nói "không" là một lần bạn mạnh hơn.' },
  { kind: 'self', text: 'Uống một ngụm nước. Đi vài bước. Cơn thèm sẽ yếu đi.' },
  { kind: 'self', text: 'Cơn thèm không làm hại bạn. Điếu thuốc mới làm hại bạn.' },
  { kind: 'breath', text: 'Thở chậm 3 lần. Mỗi lần thở ra dài hơn hít vào.' },
  // Quotes and sayings.
  { kind: 'quote', from: LAO, text: 'Hành trình vạn dặm bắt đầu từ một bước chân.' },
  { kind: 'quote', from: LAO, text: 'Thắng người là có sức. Tự thắng mình mới là mạnh.' },
  { kind: 'breath', from: TNH, text: 'Thở vào, tâm tĩnh lặng. Thở ra, miệng mỉm cười.' },
  { kind: 'breath', from: TNH, text: 'Thở vào, tôi biết tôi đang thở vào. Thở ra, tôi biết tôi đang thở ra.' },
  { kind: 'breath', from: TNH, text: 'Cảm xúc đến rồi đi như mây trên bầu trời lộng gió. Hơi thở có ý thức là chiếc neo của tôi.' },
  { kind: 'quote', from: 'Muhammad Ali', text: 'Đừng bỏ cuộc. Chịu khổ bây giờ, rồi sống phần đời còn lại như một nhà vô địch.' },
  { kind: 'quote', from: PROVERB, text: 'Có công mài sắt, có ngày nên kim.' },
  { kind: 'quote', from: PROVERB, text: 'Nước chảy đá mòn.' },
];

/** The kind of one of Iker's personal reasons, guessed from its words, only to choose its picture. */
export function kindOf(text: string): Kind {
  const t = ' ' + text.toLowerCase() + ' ';
  if (/núi dinh|leo|chạy|km|trani/.test(t)) return 'race';
  if (/ con | con\.| vợ /.test(t)) return 'family';
  if (/thở|thầy/.test(t)) return 'breath';
  if (/oxy|phổi|máu|tim/.test(t)) return 'health';
  return 'self';
}

/**
 * A shuffled bag: every reason comes once before any comes again, and the same reason never comes twice in a row.
 * `random` is a function like Math.random (the tests pass their own). `shown` is the reason on the screen now, if any.
 */
export function makeBag<T>(items: readonly T[], random: () => number = Math.random, shown?: T): () => T | undefined {
  let bag: T[] = [];
  let last: T | undefined = shown;
  return () => {
    if (!items.length) return undefined;
    if (!bag.length) {
      bag = [...items];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [bag[i], bag[j]] = [bag[j]!, bag[i]!];
      }
      if (bag.length > 1 && bag[bag.length - 1] === last) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1]!, bag[0]!];
    }
    last = bag.pop();
    return last;
  };
}

/** A small picture for each kind: plain shapes, colored by the page (currentColor). */
export const PICTURES: Record<Kind, string> = {
  race: '<path d="M4 40 L18 16 L25 27 L31 19 L44 40 Z" fill="currentColor"/><path d="M18 16 L22 23 L18 21 L14 23 Z" fill="var(--surface)"/>',
  family: '<path d="M24 41 C10 31 4 24 4 16 C4 10 9 6 14 6 C18 6 22 9 24 12 C26 9 30 6 34 6 C39 6 44 10 44 16 C44 24 38 31 24 41 Z" fill="currentColor"/>',
  health: '<path d="M3 26 H14 L18 14 L24 36 L29 20 L32 26 H45" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
  self: '<circle cx="24" cy="24" r="9" fill="currentColor"/><g stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M24 3v6M24 39v6M3 24h6M39 24h6M9 9l4 4M35 35l4 4M39 9l-4 4M13 35l-4 4"/></g>',
  breath: '<g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M4 16 C12 10 18 22 26 16 S38 10 44 16"/><path d="M4 26 C12 20 18 32 26 26 S38 20 44 26"/><path d="M4 36 C12 30 18 42 26 36 S38 30 44 36"/></g>',
  quote: '<path d="M6 36 V24 C6 15 11 9 19 8 V14 C15 15 13 18 13 22 H19 V36 Z M27 36 V24 C27 15 32 9 40 8 V14 C36 15 34 18 34 22 H40 V36 Z" fill="currentColor"/>',
};
