import Encoding from "encoding-japanese";
import { createRoute } from "honox/factory";
import iconv from "iconv-lite";

import { postResponseByThreadEpochIdUsecase } from "../../../src/conversation/usecases/postResponseByThreadEpochIdUsecase";
import { postThreadUsecase } from "../../../src/conversation/usecases/postThreadUsecase";
import { convertShiftJis } from "../../utils/convertShiftJis";
import { getIpAddress } from "../../utils/getIpAddress";

const responseBody = `
<!DOCTYPE html>
<html lang="ja">
  <head>
    <title>書きこみました。</title>
    <meta charset="Shift_JIS">
  </head>
  <body>
    書きこみが終りました。
  </body>
</html>`;

const responseBodyShiftJis = iconv.encode(responseBody, "Shift_JIS");

// eslint-disable-next-line @typescript-eslint/naming-convention
export const POST = createRoute(async (c) => {
  const { sql } = c.var;
  if (!sql) {
    return convertShiftJis("DBに接続できませんでした");
  }

  // Shift_JIS でエンコードされたフォームデータを受け取る
  const rawBody = await c.req.arrayBuffer();
  // 文字列にする
  const decodedBody = iconv.decode(Buffer.from(rawBody), "Shift_JIS");
  // &で区切り、=で分割して連想配列にする
  const paramsMap = new Map();

  for (const pair of decodedBody.split("&")) {
    const [key, value] = pair.split("=");
    paramsMap.set(key, value);
  }

  // shift_jisでデコード
  const paramsDecodedMap = new Map();
  for (const [key, value] of paramsMap) {
    // urlデコード
    const decodedValue = Encoding.urlDecode(value);
    const utf8Value = iconv.decode(Buffer.from(decodedValue), "Shift_JIS");
    paramsDecodedMap.set(key, utf8Value);
  }

  // 妥協のas string
  const name =
    typeof paramsDecodedMap.get("FROM") === "string"
      ? (paramsDecodedMap.get("FROM") as string)
      : null;
  const mail =
    typeof paramsDecodedMap.get("mail") === "string"
      ? (paramsDecodedMap.get("mail") as string)
      : null;
  const content = paramsDecodedMap.get("MESSAGE");
  const subject = paramsDecodedMap.get("subject"); // 新しいスレッド作成の場合
  const key = paramsDecodedMap.get("key"); // 既存スレッドにリプする場合

  if (!content) {
    return convertShiftJis("名前と本文は必須です。");
  }

  // subjectもkeyもない場合は不正なアクセス
  if (!subject && !key) {
    return convertShiftJis("不正なアクセスです");
  }

  const ipAddressRaw = getIpAddress(c);

  // subjectがある場合→新規スレッド作成
  if (subject) {
    const result = await postThreadUsecase(
      { sql },
      {
        threadTitleRaw: subject,
        authorNameRaw: name,
        mailRaw: mail,
        responseContentRaw: content,
        ipAddressRaw,
      }
    );
    if (result.isErr()) {
      return convertShiftJis(`エラーが発生しました: ${result.error.message}`);
    }

    // 成功した場合は書き込み完了画面を表示
    return new Response(responseBodyShiftJis, {
      headers: { "Content-Type": "text/html; charset=Shift_JIS" },
    });
    // keyがある場合→レスポンス追加
  } else if (key) {
    const result = await postResponseByThreadEpochIdUsecase(
      { sql },
      {
        threadEpochIdRaw: key,
        authorNameRaw: name,
        mailRaw: mail,
        responseContentRaw: content,
        ipAddressRaw,
      }
    );
    if (result.isErr()) {
      return convertShiftJis(`エラーが発生しました: ${result.error.message}`);
    }

    return new Response(responseBodyShiftJis, {
      headers: { "Content-Type": "text/html; charset=Shift_JIS" },
    });
  }
});

export default createRoute((_) => {
  return convertShiftJis("不正なアクセスです");
});
