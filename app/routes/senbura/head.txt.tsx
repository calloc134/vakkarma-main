import { createRoute } from "honox/factory";

import { getBoardConfigUsecase } from "../../../src/usecases/getBoardConfigUsecase";
import { sql } from "../../db";
import { convertShiftJis } from "../../utils/convertShiftJis";

export default createRoute(async (_) => {
  if (!sql) {
    return convertShiftJis("DBに接続できませんでした");
  }
  const config = await getBoardConfigUsecase({ sql });
  if (config.isErr()) {
    return convertShiftJis(`エラーが発生しました: ${config.error.message}`);
  }
  return convertShiftJis(config.value.localRule);
});
