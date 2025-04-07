import { ok, err } from "neverthrow";

import { DatabaseError } from "../../shared/types/Error";

import type { VakContext } from "../../shared/types/VakContext";
import type { WriteNormalConfig } from "../domain/write/WriteNormalConfig";
import type { Result } from "neverthrow";

export const updateNormalConfigRepository = async (
  { sql, logger }: VakContext,
  config: WriteNormalConfig
): Promise<Result<undefined, Error>> => {
  const { boardName, localRule, defaultAuthorName, maxContentLength } = config;

  logger.debug({
    operation: "updateNormalConfig",
    boardName: boardName.val,
    defaultAuthorName: defaultAuthorName.val,
    maxContentLength: maxContentLength.val,
    message: "Updating configuration in database",
  });

  try {
    await sql`
            UPDATE
                config
            SET
                board_name = ${boardName.val},
                local_rule = ${localRule.val},
                nanashi_name = ${defaultAuthorName.val},
                max_content_length = ${maxContentLength.val}
        `;

    logger.info({
      operation: "updateNormalConfig",
      boardName: boardName.val,
      message: "Configuration updated successfully in database",
    });

    return ok(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "updateNormalConfig",
      error,
      message: `Database error while updating configuration: ${message}`,
    });
    return err(
      new DatabaseError(`設定の更新中にエラーが発生しました: ${message}`, error)
    );
  }
};
