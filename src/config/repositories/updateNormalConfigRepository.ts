import { ok, err } from "neverthrow";

import { DatabaseError } from "../../types/Error";

import type { DbContext } from "../../types/DbContext";
import type { WriteNormalConfig } from "../domain/write/WriteNormalConfig";
import type { Result } from "neverthrow";

export const updateNormalConfigRepository = async (
  { sql }: DbContext,
  config: WriteNormalConfig
): Promise<Result<undefined, Error>> => {
  const { boardName, localRule, defaultAuthorName, maxContentLength } = config;

  try {
    await sql`
            UPDATE
                config
            SET
                board_name = ${boardName.val},
                local_rule = ${localRule.val},
                nanashi_name = ${defaultAuthorName.val},
                max_content_length = ${maxContentLength.val}
        `;

    return ok(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(`設定の更新中にエラーが発生しました: ${message}`, error)
    );
  }
};
