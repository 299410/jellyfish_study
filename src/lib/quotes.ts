export interface Quote {
  text: string;      // Japanese characters (e.g. 継続は力なり)
  furigana: string;  // Reading representation (けいぞくはちからなり)
  romaji: string;    // Romaji pronunciation (Keizoku wa chikara nari)
  meaning: string;   // Dịch nghĩa tiếng Việt / Anh
}

export const MOTIVATIONAL_QUOTES: Quote[] = [
  {
    text: "<ruby>継続<rt>けいぞく</rt></ruby>は<ruby>力<rt>ちから</rt></ruby>なり。",
    furigana: "けいぞくは ちからなり。",
    romaji: "Keizoku wa chikara nari.",
    meaning: "Sự kiên trì chính là sức mạnh. Mưa dầm thấm lâu."
  },
  {
    text: "<ruby>七転<rt>ななころ</rt></ruby>び<ruby>八起<rt>やお</rt></ruby>き。",
    furigana: "ななころび やおき。",
    romaji: "Nanakorobi yaoki.",
    meaning: "7 lần ngã, 8 lần đứng dậy. Không bao giờ bỏ cuộc."
  },
  {
    text: "<ruby>千里<rt>せんり</rt></ruby>の<ruby>道<rt>みち</rt></ruby>も<ruby>一歩<rt>いっぽ</rt></ruby>から。",
    furigana: "せんりの みちも いっぽから。",
    romaji: "Senri no michi mo ippo kara.",
    meaning: "Hành trình vạn dặm cũng phải bắt đầu từ những bước đi đầu tiên."
  },
  {
    text: "<ruby>一生懸命<rt>いっしょうけんめい</rt></ruby>。",
    furigana: "いっしょうけんめい。",
    romaji: "Isshou kenmei.",
    meaning: "Cố gắng hết sức mình. Nỗ lực hết cuộc đời."
  },
  {
    text: "<ruby>少<rt>すこ</rt></ruby>しずつ、<ruby>前<rt>まえ</rt></ruby>へ。",
    furigana: "すこしずつ、まえへ。",
    romaji: "Sukoshizutsu, mae he.",
    meaning: "Từng chút một, tiến về phía trước."
  },
  {
    text: "ちりも<ruby>積<rt>つも</rt></ruby>れば<ruby>山<rt>やま</rt></ruby>となる。",
    furigana: "ちりも つもれば やまとなる。",
    romaji: "Chiri mo tsumoreba yama to naru.",
    meaning: "Tích tiểu thành đại. Cát bụi tích tụ lại cũng hoá núi cao."
  },
  {
    text: "<ruby>一期一会<rt>いちごいちえ</rt></ruby>。",
    furigana: "いちごいちえ。",
    romaji: "Ichigo ichie.",
    meaning: "Nhất kỳ nhất hội. Trân trọng từng cuộc gặp gỡ trong đời."
  }
];

export function getDailyQuote(): Quote {
  const today = new Date();
  // Hash the date to get a stable index for the day
  const dateString = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = dateString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[index];
}
