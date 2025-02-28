import { err, ok } from "neverthrow";

import { createReadAuthorName } from "../domain/value_object/ReadAuthorName";
import { DatabaseError, DataNotFoundError } from "../types/Error";

import type { ReadAuthorName } from "../domain/value_object/ReadAuthorName";
import type { DbContext } from "../types/DbContext";
import type { Result } from "neverthrow";

export const getNanashiConfigRepository = async ({
  sql,
}: DbContext): Promise<
  Result<ReadAuthorName, DatabaseError | DataNotFoundError>
> => {
  try {
    const result = await sql<{ nanashi_name: string }[]>`
          SELECT nanashi_name FROM config LIMIT 1
        `;

    if (!result || result.length !== 1) {
      return err(new DataNotFoundError("設定の取得に失敗しました"));
    }

    const nanashiName = createReadAuthorName(result[0].nanashi_name, null);
    if (nanashiName.isErr()) {
      return err(nanashiName.error);
    }

    return ok(nanashiName.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(`設定取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
