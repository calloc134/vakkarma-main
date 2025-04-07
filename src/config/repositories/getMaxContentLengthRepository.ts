import { err, ok } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../../types/Error";
import {
  createReadMaxContentLength,
  type ReadMaxContentLength,
} from "../domain/read/ReadMaxContentLength";

import type { VakContext } from "../../types/VakContext";
import type { Result } from "neverthrow";

export const getMaxContentLengthRepository = async ({
  sql, logger
}: VakContext): Promise<
  Result<ReadMaxContentLength, DatabaseError | DataNotFoundError>
> => {
  logger.debug({
    operation: "getMaxContentLength",
    message: "Fetching maximum content length from database"
  });

  try {
    const result = await sql<{ max_content_length: number }[]>`
        SELECT max_content_length FROM config LIMIT 1
      `;
    if (!result || result.length !== 1) {
      logger.error({
        operation: "getMaxContentLength",
        message: "Failed to retrieve maximum content length, invalid database response"
      });
      return err(new DataNotFoundError("設定の取得に失敗しました"));
    }

    logger.debug({
      operation: "getMaxContentLength",
      maxContentLength: result[0].max_content_length,
      message: "Maximum content length retrieved from database"
    });

    const maxContentLengthResult = createReadMaxContentLength(
      result[0].max_content_length
    );
    if (maxContentLengthResult.isErr()) {
      logger.error({
        operation: "getMaxContentLength",
        error: maxContentLengthResult.error,
        message: "Invalid maximum content length format"
      });
      return err(maxContentLengthResult.error);
    }

    logger.info({
      operation: "getMaxContentLength",
      maxContentLength: maxContentLengthResult.value.val,
      message: "Maximum content length retrieved and validated successfully"
    });

    return ok(maxContentLengthResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "getMaxContentLength",
      error,
      message: `Database error while fetching maximum content length: ${message}`
    });
    return err(
      new DatabaseError(`設定取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
