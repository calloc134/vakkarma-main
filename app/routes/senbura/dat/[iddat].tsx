import { createRoute } from "honox/factory";

import { formatReadAuthorName } from "../../../../src/conversation/domain/read/ReadAuthorName";
import { getAllResponsesByThreadEpochIdUsecase } from "../../../../src/conversation/usecases/getAllResponsesByThreadEpochIdUsecase";
import { formatDate } from "../../../../src/shared/utils/formatDate";
import { convertShiftJis } from "../../../utils/convertShiftJis";

export default createRoute(async (c) => {
  const { sql, logger } = c.var;
  if (!sql) {
    return convertShiftJis("DBに接続できませんでした");
  }

  // [id].dat という形で渡される
  const idAat = c.req.param("iddat");

  // 分割する
  const id = idAat.split(".")[0];
  if (!id) {
    return convertShiftJis("スレッドIDが指定されていません");
  }

  const responsesResult = await getAllResponsesByThreadEpochIdUsecase(
    { sql, logger },
    { threadEpochIdRaw: id }
  );
  if (responsesResult.isErr()) {
    return convertShiftJis(
      `エラーが発生しました: ${responsesResult.error.message}`
    );
  }

  const title = responsesResult.value.thread.threadTitle.val;
  let text = "";
  for (const resp of responsesResult.value.responses) {
    const formattedDate = formatDate(resp.postedAt.val, {
      acceptLanguage: c.req.header("Accept-Language") ?? undefined,
    });
    const formattedUserName = formatReadAuthorName(resp.authorName);

    text += `${formattedUserName}<>${resp.mail.val}<>${formattedDate} ID:${
      resp.hashId.val
    }<>${resp.responseContent.val.replace(/\n/g, "<br>")}<>${title}\r\n`;
  }
  return convertShiftJis(text);
});
