import { err, ok } from "neverthrow";

import { DatabaseError } from "../types/Error";

import type { Config } from "../domain/write_model/Config";
import type { DbContext } from "../types/DbContext";
import type { Result } from "neverthrow";

export const getConfigRepository = async ({
  sql,
}: DbContext): Promise<Result<Config, Error>> => {
  try {
    const result = await sql<
      {
        board_name: string;
        local_rule: string;
        nanashi_name: string;
        max_content_length: number;
      }[]
    >`
            SELECT
                board_name,
                local_rule,
                nanashi_name,
                max_content_length
            FROM
                config
        `;

    if (!result || result.length !== 1) {
      return err(new DatabaseError("設定の取得に失敗しました"));
    }

    return ok({
      _type: "Config",
      boardName: result[0].board_name,
      localRule: result[0].local_rule,
      nanashiName: result[0].nanashi_name,
      maxContentLength: result[0].max_content_length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(`設定の取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
