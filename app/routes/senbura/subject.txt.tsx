import { createRoute } from "honox/factory";

import { getAllThreadsWithEpochIdUsecase } from "../../../src/conversation/usecases/getAllThreadsWithEpochIdUsecase";
import { sql } from "../../db";
import { convertShiftJis } from "../../utils/convertShiftJis";

export default createRoute(async (_) => {
  if (!sql) {
    return convertShiftJis("DBに接続できませんでした");
  }
  const threads = await getAllThreadsWithEpochIdUsecase({ sql });
  if (threads.isErr()) {
    return convertShiftJis(`エラーが発生しました: ${threads.error.message}`);
  }

  let text = "";
  for (const thread of threads.value) {
    text += `${thread.threadEpochId.val}.dat<>${thread.title.val} (${thread.countResponse})\r\n`;
  }
  return convertShiftJis(text);
});
