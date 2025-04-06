import { ok, err } from "neverthrow";

import { DatabaseError } from "../../types/Error";

import type { VakContext } from "../../types/VakContext";
import type { WritePasswordHash } from "../domain/write/WritePasswordHash";
import type { Result } from "neverthrow";

export const updatePasswordHashRepository = async (
  { sql }: VakContext,
  passwordHash: WritePasswordHash
): Promise<Result<undefined, Error>> => {
  try {
    await sql`
    UPDATE
        config
    SET
        admin_password = ${passwordHash.val}
    `;
    return ok(undefined);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(
        `パスワード更新中にエラーが発生しました: ${message}`,
        error
      )
    );
  }
};
