import { createRoute } from "honox/factory";

import { getBoardConfigUsecase } from "../../../src/config/usecases/getBoardConfigUsecase";
import { convertShiftJis } from "../../utils/convertShiftJis";

export default createRoute(async (c) => {
  const { sql } = c.var;
  if (!sql) {
    return convertShiftJis("DBに接続できませんでした");
  }
  const config = await getBoardConfigUsecase({ sql });
  if (config.isErr()) {
    return convertShiftJis(`エラーが発生しました: ${config.error.message}`);
  }

  const boardName = config.value.boardName;
  const responseText = `掲示板設定情報: ${boardName}`;
  return convertShiftJis(responseText);
});
