import { ok, err } from "neverthrow";

import { DatabaseError } from "../../types/Error";

import type { VakContext } from "../../types/VakContext";
import type { WritePasswordHash } from "../domain/write/WritePasswordHash";
import type { Result } from "neverthrow";

export const updatePasswordHashRepository = async (
  { sql, logger }: VakContext,
  passwordHash: WritePasswordHash
): Promise<Result<undefined, Error>> => {
  logger.debug({
    operation: "updatePasswordHash",
    message: "Updating admin password hash in database"
  });
  
  try {
    await sql`
    UPDATE
        config
    SET
        admin_password = ${passwordHash.val}
    `;
    
    logger.info({
      operation: "updatePasswordHash",
      message: "Admin password hash updated successfully"
    });
    
    return ok(undefined);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "updatePasswordHash",
      error,
      message: `Database error while updating password hash: ${message}`
    });
    return err(
      new DatabaseError(
        `パスワード更新中にエラーが発生しました: ${message}`,
        error
      )
    );
  }
};
