import { err, ok } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../../types/Error";
import {
  createReadMaxContentLength,
  type ReadMaxContentLength,
} from "../domain/read/ReadMaxContentLength";

import type { VakContext } from "../../types/VakContext";
import type { Result } from "neverthrow";

export const getMaxContentLengthRepository = async ({
  sql,
}: VakContext): Promise<
  Result<ReadMaxContentLength, DatabaseError | DataNotFoundError>
> => {
  try {
    const result = await sql<{ max_content_length: number }[]>`
        SELECT max_content_length FROM config LIMIT 1
      `;
    if (!result || result.length !== 1) {
      return err(new DataNotFoundError("設定の取得に失敗しました"));
    }

    const maxContentLengthResult = createReadMaxContentLength(
      result[0].max_content_length
    );
    if (maxContentLengthResult.isErr()) {
      return err(maxContentLengthResult.error);
    }

    return ok(maxContentLengthResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(`設定取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
