import { createRoute } from "honox/factory";

import { formatReadAuthorName } from "../../../../src/domain/value_object/ReadAuthorName";
import { getAllResponsesByThreadEpochIdUsecase } from "../../../../src/usecases/getAllResponsesByThreadEpochIdUsecase";
import { formatDate } from "../../../../src/utils/formatDate";
import { sql } from "../../../db";
import { convertShiftJis } from "../../../utils/convertShiftJis";

export default createRoute(async (c) => {
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
    { sql },
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
    const formattedDate = formatDate(resp.postedAt.val);
    const formattedUserName = formatReadAuthorName(resp.authorName);

    text += `${formattedUserName}<>${resp.mail.val}<>${formattedDate} ID:${
      resp.hashId.val
    }<>${resp.responseContent.val.replace(/\n/g, "<br>")}<>${title}\r\n`;
  }
  return convertShiftJis(text);
});
