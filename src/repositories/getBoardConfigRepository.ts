import { err, ok } from "neverthrow";

import { createBoardConfig } from "../domain/read_model/BoardConfig";
import { DatabaseError, DataNotFoundError } from "../types/Error";

import type { BoardConfig } from "../domain/read_model/BoardConfig";
import type { DbContext } from "../types/DbContext";
import type { Result } from "neverthrow";

export const getBoardConfigRepository = async ({
  sql,
}: DbContext): Promise<
  Result<BoardConfig, DatabaseError | DataNotFoundError>
> => {
  try {
    const result = await sql<{ board_name: string; local_rule: string }[]>`
          SELECT board_name, local_rule FROM config LIMIT 1
        `;

    if (!result || result.length !== 1) {
      return err(new DataNotFoundError("設定の取得に失敗しました"));
    }

    // 適当に詰め替え・とりあえず適当に
    const config = createBoardConfig({
      boardName: result[0].board_name,
      localRule: result[0].local_rule,
    });
    if (config.isErr()) {
      return err(config.error);
    }

    return ok(config.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(`設定取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
