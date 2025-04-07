import { err, ok } from "neverthrow";
import { Result } from "neverthrow";

import { DatabaseError } from "../../shared/types/Error";
import { createReadBoardName } from "../domain/read/ReadBoardName";
import { createReadDefaultAuthorName } from "../domain/read/ReadDefaultAuthorName";
import { createReadLocalRule } from "../domain/read/ReadLocalRule";
import { createReadMaxContentLength } from "../domain/read/ReadMaxContentLength";
import {
  createReadNormalConfig,
  type ReadNormalConfig,
} from "../domain/read/ReadNormalConfig";

import type { VakContext } from "../../shared/types/VakContext";

export const getNormalConfigRepository = async ({
  sql,
  logger,
}: VakContext): Promise<Result<ReadNormalConfig, DatabaseError>> => {
  logger.debug({
    operation: "getNormalConfig",
    message: "Fetching board configuration from database",
  });

  try {
    const result = await sql<
      {
        board_name: string;
        local_rule: string;
        nanashi_name: string;
        max_content_length: number;
      }[]
    >`
            SELECT
                board_name,
                local_rule,
                nanashi_name,
                max_content_length
            FROM
                config
        `;

    if (!result || result.length !== 1) {
      logger.error({
        operation: "getNormalConfig",
        message: "Failed to retrieve configuration, invalid database response",
      });
      return err(new DatabaseError("設定の取得に失敗しました"));
    }

    logger.debug({
      operation: "getNormalConfig",
      boardName: result[0].board_name,
      maxContentLength: result[0].max_content_length,
      message: "Configuration data retrieved from database",
    });

    const combinedResult = Result.combine([
      createReadBoardName(result[0].board_name),
      createReadLocalRule(result[0].local_rule),
      createReadDefaultAuthorName(result[0].nanashi_name),
      createReadMaxContentLength(result[0].max_content_length),
    ]);

    if (combinedResult.isErr()) {
      logger.error({
        operation: "getNormalConfig",
        error: combinedResult.error,
        message: "Failed to create domain objects from database result",
      });
      return err(combinedResult.error);
    }

    const [boardName, localRule, defaultAuthorName, maxContentLength] =
      combinedResult.value;

    const normalConfigResult = createReadNormalConfig({
      boardName,
      localRule,
      defaultAuthorName,
      maxContentLength,
    });

    if (normalConfigResult.isErr()) {
      logger.error({
        operation: "getNormalConfig",
        error: normalConfigResult.error,
        message: "Failed to create ReadNormalConfig object",
      });
      return err(normalConfigResult.error);
    }

    logger.info({
      operation: "getNormalConfig",
      boardName: boardName.val,
      message: "Configuration retrieved successfully",
    });

    return ok(normalConfigResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "getNormalConfig",
      error,
      message: `Database error while retrieving configuration: ${message}`,
    });
    return err(
      new DatabaseError(`設定の取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
