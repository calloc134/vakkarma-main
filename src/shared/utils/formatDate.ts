import { ja, enUS } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

import type { Locale } from "date-fns";

// モジュールロード時に実行環境のタイムゾーンをキャッシュ
const defaultTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// Accept-Language ヘッダから言語を判定し、標準的な IANA タイムゾーンを推定
function inferTimeZone(code: string): string {
  if (code.startsWith("ja")) return "Asia/Tokyo";
  if (code.startsWith("en-us")) return "America/New_York";
  if (code.startsWith("en-gb")) return "Europe/London";
  return defaultTimeZone;
}

/**
 * Accept-Language ヘッダを参照し、対応するロケール／タイムゾーンで日付をフォーマット
 */
export function formatDate(
  date: Date,
  options?: { acceptLanguage?: string }
): string {
  const lang = options?.acceptLanguage?.split(",")[0].toLowerCase() || "";
  const tz = inferTimeZone(lang);
  const locale: Locale = lang.startsWith("ja") ? ja : enUS;
  // 一度の呼び出しで yyyy/MM/dd(E) HH:mm:ss.SS (タイムゾーン) を埋め込む
  const pattern = `yyyy/MM/dd(E) HH:mm:ss.SS '(${tz})'`;
  return formatInTimeZone(date, tz, pattern, { locale });
}
