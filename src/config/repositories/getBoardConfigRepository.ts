import { err, ok } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../../types/Error";
import {
  createReadBoardConfig,
  type ReadBoardConfig,
} from "../domain/read/ReadBoardConfig";
import { createReadBoardName } from "../domain/read/ReadBoardName";
import { createReadLocalRule } from "../domain/read/ReadLocalRule";

import type { VakContext } from "../../types/VakContext";
import type { Result } from "neverthrow";

export const getBoardConfigRepository = async ({
  sql,
}: VakContext): Promise<
  Result<ReadBoardConfig, DatabaseError | DataNotFoundError>
> => {
  try {
    const result = await sql<{ board_name: string; local_rule: string }[]>`
          SELECT board_name, local_rule FROM config LIMIT 1
        `;

    if (!result || result.length !== 1) {
      return err(new DataNotFoundError("設定の取得に失敗しました"));
    }

    const boardNameResult = createReadBoardName(result[0].board_name);
    if (boardNameResult.isErr()) {
      return err(boardNameResult.error);
    }
    const localRuleResult = createReadLocalRule(result[0].local_rule);
    if (localRuleResult.isErr()) {
      return err(localRuleResult.error);
    }

    // 適当に詰め替え・とりあえず適当に
    const config = createReadBoardConfig({
      boardName: boardNameResult.value,
      localRule: localRuleResult.value,
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
