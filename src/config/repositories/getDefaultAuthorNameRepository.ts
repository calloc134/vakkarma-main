import { err, ok } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../../types/Error";
import {
  createReadDefaultAuthorName,
  type ReadDefaultAuthorName,
} from "../domain/read/ReadDefaultAuthorName";

import type { VakContext } from "../../types/VakContext";
import type { Result } from "neverthrow";

export const getDefaultAuthorNameRepository = async ({
  sql,
}: VakContext): Promise<
  Result<ReadDefaultAuthorName, DatabaseError | DataNotFoundError>
> => {
  try {
    const result = await sql<{ nanashi_name: string }[]>`
        SELECT nanashi_name FROM config LIMIT 1
      `;

    if (!result || result.length !== 1) {
      return err(new DataNotFoundError("設定の取得に失敗しました"));
    }

    const defaultAuthorNameResult = createReadDefaultAuthorName(
      result[0].nanashi_name
    );
    if (defaultAuthorNameResult.isErr()) {
      return err(defaultAuthorNameResult.error);
    }

    return ok(defaultAuthorNameResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(`設定取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
