import { ja, enUS } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

import type { Locale } from "date-fns";

// Accept-Language ヘッダから簡易的にタイムゾーンを推定
/**
 * Accept-Language ヘッダから言語を判定し、標準的な IANA タイムゾーンを推定
 */
function inferTimeZone(code: string): string {
  if (code.startsWith("ja")) return "Asia/Tokyo";
  if (code.startsWith("en-us")) return "America/New_York";
  if (code.startsWith("en-gb")) return "Europe/London";
  // その他は実行環境のタイムゾーン
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Accept-Language ヘッダとタイムゾーン対応した日付フォーマット
/**
 * Accept-Language ヘッダから言語を判定し、標準的な IANA タイムゾーンを推定してフォーマット
 */
export function formatDate(
  date: Date,
  options?: { acceptLanguage?: string }
): string {
  // 曜日マップ
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  // ロケール選択
  const lang = options?.acceptLanguage?.split(",")[0].toLowerCase() || "";
  const locale: Locale = lang.startsWith("ja") ? ja : enUS;
  // タイムゾーン推定

  const tz = inferTimeZone(lang);
  // yyyy/MM/dd HH:mm:ss.SS までフォーマット
  const formatted = formatInTimeZone(date, tz, "yyyy/MM/dd HH:mm:ss.SS", {
    locale,
  });
  // フォーマット結果に曜日挿入: formatted例 "2025/02/23 08:41:28.90"
  const [ymd, hmss] = formatted.split(" ");
  // タイムゾーン考慮後の週日取得
  const zonedDate = new Date(
    formatInTimeZone(date, tz, "yyyy-MM-dd'T'HH:mm:ssXXX")
  );
  const dow = weekdays[zonedDate.getDay()];
  return `${ymd}(${dow}) ${hmss} (${tz})`;
}
