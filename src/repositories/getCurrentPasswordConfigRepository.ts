import { ok, err } from "neverthrow";

import { DatabaseError } from "../types/Error";

import type { DbContext } from "../types/DbContext";
import type { Result } from "neverthrow";

export const getCurrentPasswordConfigRepository = async ({
  sql,
}: DbContext): Promise<Result<string, Error>> => {
  try {
    const result = await sql<{ admin_password: string }[]>`
            SELECT
                admin_password
            FROM
                config
        `;

    if (!result || result.length !== 1) {
      return err(new DatabaseError("設定の取得に失敗しました"));
    }

    return ok(result[0].admin_password);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(`設定の取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
