import { err, ok } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../../shared/types/Error";
import {
  createReadBoardConfig,
  type ReadBoardConfig,
} from "../domain/read/ReadBoardConfig";
import { createReadBoardName } from "../domain/read/ReadBoardName";
import { createReadLocalRule } from "../domain/read/ReadLocalRule";

import type { VakContext } from "../../shared/types/VakContext";
import type { Result } from "neverthrow";

export const getBoardConfigRepository = async ({
  sql,
  logger,
}: VakContext): Promise<
  Result<ReadBoardConfig, DatabaseError | DataNotFoundError>
> => {
  logger.debug({
    operation: "getBoardConfig",
    message: "Fetching board configuration from database",
  });

  try {
    const result = await sql<{ board_name: string; local_rule: string }[]>`
          SELECT board_name, local_rule FROM config LIMIT 1
        `;

    if (!result || result.length !== 1) {
      logger.error({
        operation: "getBoardConfig",
        message:
          "Failed to retrieve board configuration, invalid database response",
      });
      return err(new DataNotFoundError("設定の取得に失敗しました"));
    }

    logger.debug({
      operation: "getBoardConfig",
      boardName: result[0].board_name,
      message: "Board configuration retrieved successfully",
    });

    const boardNameResult = createReadBoardName(result[0].board_name);
    if (boardNameResult.isErr()) {
      logger.error({
        operation: "getBoardConfig",
        error: boardNameResult.error,
        message: "Invalid board name format",
      });
      return err(boardNameResult.error);
    }
    const localRuleResult = createReadLocalRule(result[0].local_rule);
    if (localRuleResult.isErr()) {
      logger.error({
        operation: "getBoardConfig",
        error: localRuleResult.error,
        message: "Invalid local rule format",
      });
      return err(localRuleResult.error);
    }

    // 適当に詰め替え・とりあえず適当に
    const config = createReadBoardConfig({
      boardName: boardNameResult.value,
      localRule: localRuleResult.value,
    });
    if (config.isErr()) {
      logger.error({
        operation: "getBoardConfig",
        error: config.error,
        message: "Failed to create board config object",
      });
      return err(config.error);
    }

    logger.info({
      operation: "getBoardConfig",
      boardName: boardNameResult.value.val,
      message: "Board configuration retrieved and validated successfully",
    });

    return ok(config.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "getBoardConfig",
      error,
      message: `Database error while fetching board configuration: ${message}`,
    });
    return err(
      new DatabaseError(`設定取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
