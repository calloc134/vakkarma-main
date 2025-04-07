const padZero = (num: number, len: number = 2): string => {
  return String(num).padStart(len, "0");
};

// 日時の形式を整えて文字列にする関数
export function formatDate(date: Date): string {
  // 2025/02/23(日) 08:41:28.90 など
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1); // 2桁表示
  const day = padZero(date.getDate()); // 2桁表示
  const hour = padZero(date.getHours()); // 2桁表示
  const minute = padZero(date.getMinutes()); // 2桁表示
  const second = padZero(date.getSeconds()); // 2桁表示
  const millisecond = padZero(date.getMilliseconds(), 3); //3桁
  const getWeekday = (date: Date) => {
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return weekdays[date.getDay()];
  };
  return `${year}/${month}/${day}(${getWeekday(
    date
  )}) ${hour}:${minute}:${second}.${millisecond.substring(0, 2)}`; //ミリ秒も最初から二桁で表示
}
