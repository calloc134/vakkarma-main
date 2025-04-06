import { err, ok } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../../types/Error";
import {
  createReadPasswordHash,
  type ReadPasswordHash,
} from "../domain/read/ReadPasswordHash";

import type { VakContext } from "../../types/VakContext";
import type { Result } from "neverthrow";

export const getPasswordHashRepository = async ({
  sql,
}: VakContext): Promise<
  Result<ReadPasswordHash, DatabaseError | DataNotFoundError>
> => {
  try {
    const result = await sql<{ admin_password: string }[]>`
        SELECT admin_password FROM config LIMIT 1
      `;

    if (!result || result.length !== 1) {
      return err(new DataNotFoundError("設定の取得に失敗しました"));
    }

    const adminPassword = result[0].admin_password;

    const passwordHashResult = createReadPasswordHash(adminPassword);
    if (passwordHashResult.isErr()) {
      return err(passwordHashResult.error);
    }

    return ok(passwordHashResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(`設定取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
