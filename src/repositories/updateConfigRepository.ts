import { ok, err } from "neverthrow";

import { DatabaseError } from "../types/Error";

import type { Config } from "../domain/write_model/Config";
import type { DbContext } from "../types/DbContext";
import type { Result } from "neverthrow";

export const updateConfigRepository = async (
  { sql }: DbContext,
  config: Config
): Promise<Result<undefined, Error>> => {
  const { boardName, localRule, nanashiName, maxContentLength } = config;

  try {
    await sql`
            UPDATE
                config
            SET
                board_name = ${boardName},
                local_rule = ${localRule},
                nanashi_name = ${nanashiName},
                max_content_length = ${maxContentLength}
        `;

    return ok(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(`設定の更新中にエラーが発生しました: ${message}`, error)
    );
  }
};
