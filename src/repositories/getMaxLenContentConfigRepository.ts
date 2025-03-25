import { err, ok } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../types/Error";

import type { DbContext } from "../types/DbContext";
import type { Result } from "neverthrow";

export const getMaxLenContentConfigRepository = async ({
  sql,
}: DbContext): Promise<Result<number, DatabaseError | DataNotFoundError>> => {
  try {
    const result = await sql<{ max_content_length: number }[]>`
      SELECT max_content_length FROM config LIMIT 1
    `;
    if (!result || result.length !== 1) {
      return err(new DataNotFoundError("設定の取得に失敗しました"));
    }
    return ok(result[0].max_content_length);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(`設定取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
