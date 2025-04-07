import { err, ok } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../../types/Error";
import {
  createReadPasswordHash,
  type ReadPasswordHash,
} from "../domain/read/ReadPasswordHash";

import type { VakContext } from "../../types/VakContext";
import type { Result } from "neverthrow";

export const getPasswordHashRepository = async ({
  sql, logger
}: VakContext): Promise<
  Result<ReadPasswordHash, DatabaseError | DataNotFoundError>
> => {
  logger.debug({
    operation: "getPasswordHash",
    message: "Fetching admin password hash from database"
  });
  
  try {
    const result = await sql<{ admin_password: string }[]>`
        SELECT admin_password FROM config LIMIT 1
      `;

    if (!result || result.length !== 1) {
      logger.error({
        operation: "getPasswordHash",
        message: "Failed to retrieve admin password hash, invalid database response"
      });
      return err(new DataNotFoundError("設定の取得に失敗しました"));
    }

    logger.debug({
      operation: "getPasswordHash",
      message: "Admin password hash retrieved from database"
    });

    const adminPassword = result[0].admin_password;

    const passwordHashResult = createReadPasswordHash(adminPassword);
    if (passwordHashResult.isErr()) {
      logger.error({
        operation: "getPasswordHash",
        error: passwordHashResult.error,
        message: "Invalid password hash format"
      });
      return err(passwordHashResult.error);
    }

    logger.info({
      operation: "getPasswordHash",
      message: "Admin password hash retrieved and validated successfully"
    });

    return ok(passwordHashResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "getPasswordHash",
      error,
      message: `Database error while fetching admin password hash: ${message}`
    });
    return err(
      new DatabaseError(`設定取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
