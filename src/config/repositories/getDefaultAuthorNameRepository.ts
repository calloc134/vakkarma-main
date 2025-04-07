import { err, ok } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../../shared/types/Error";
import {
  createReadDefaultAuthorName,
  type ReadDefaultAuthorName,
} from "../domain/read/ReadDefaultAuthorName";

import type { VakContext } from "../../shared/types/VakContext";
import type { Result } from "neverthrow";

export const getDefaultAuthorNameRepository = async ({
  sql,
  logger,
}: VakContext): Promise<
  Result<ReadDefaultAuthorName, DatabaseError | DataNotFoundError>
> => {
  logger.debug({
    operation: "getDefaultAuthorName",
    message: "Fetching default author name from database",
  });

  try {
    const result = await sql<{ nanashi_name: string }[]>`
        SELECT nanashi_name FROM config LIMIT 1
      `;

    if (!result || result.length !== 1) {
      logger.error({
        operation: "getDefaultAuthorName",
        message:
          "Failed to retrieve default author name, invalid database response",
      });
      return err(new DataNotFoundError("設定の取得に失敗しました"));
    }

    logger.debug({
      operation: "getDefaultAuthorName",
      defaultAuthorName: result[0].nanashi_name,
      message: "Default author name retrieved from database",
    });

    const defaultAuthorNameResult = createReadDefaultAuthorName(
      result[0].nanashi_name
    );
    if (defaultAuthorNameResult.isErr()) {
      logger.error({
        operation: "getDefaultAuthorName",
        error: defaultAuthorNameResult.error,
        message: "Invalid default author name format",
      });
      return err(defaultAuthorNameResult.error);
    }

    logger.info({
      operation: "getDefaultAuthorName",
      defaultAuthorName: defaultAuthorNameResult.value.val,
      message: "Default author name retrieved and validated successfully",
    });

    return ok(defaultAuthorNameResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "getDefaultAuthorName",
      error,
      message: `Database error while fetching default author name: ${message}`,
    });
    return err(
      new DatabaseError(`設定取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
