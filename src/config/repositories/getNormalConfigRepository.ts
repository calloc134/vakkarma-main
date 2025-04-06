import { err, ok } from "neverthrow";
import { Result } from "neverthrow";

import { DatabaseError } from "../../types/Error";
import { createReadBoardName } from "../domain/read/ReadBoardName";
import { createReadDefaultAuthorName } from "../domain/read/ReadDefaultAuthorName";
import { createReadLocalRule } from "../domain/read/ReadLocalRule";
import { createReadMaxContentLength } from "../domain/read/ReadMaxContentLength";
import {
  createReadNormalConfig,
  type ReadNormalConfig,
} from "../domain/read/ReadNormalConfig";

import type { VakContext } from "../../types/VakContext";

export const getNormalConfigRepository = async ({
  sql,
}: VakContext): Promise<Result<ReadNormalConfig, DatabaseError>> => {
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
    const combinedResult = Result.combine([
      createReadBoardName(result[0].board_name),
      createReadLocalRule(result[0].local_rule),
      createReadDefaultAuthorName(result[0].nanashi_name),
      createReadMaxContentLength(result[0].max_content_length),
    ]);

    if (combinedResult.isErr()) {
      return err(combinedResult.error);
    }

    const [boardName, localRule, defaultAuthorName, maxContentLength] =
      combinedResult.value;

    const normalConfigResult = createReadNormalConfig({
      boardName,
      localRule,
      defaultAuthorName,
      maxContentLength,
    });

    if (normalConfigResult.isErr()) {
      return err(normalConfigResult.error);
    }

    return ok(normalConfigResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(`設定の取得中にエラーが発生しました: ${message}`, error)
    );
  }
};
