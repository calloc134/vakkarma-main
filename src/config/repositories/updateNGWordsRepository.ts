import { ok, err } from "neverthrow";

import { DatabaseError } from "../../shared/types/Error";

import type { VakContext } from "../../shared/types/VakContext";
import type { WriteNGWord } from "../domain/write/WriteNGWord";
import type { Result } from "neverthrow";

export const updateNGWordsRepository = async (
  vakContext: VakContext,
  words: WriteNGWord[]
): Promise<Result<undefined, DatabaseError>> => {
  const { sql, logger } = vakContext;

  logger.debug({
    operation: "updateNGWordsRepository",
    message: "Updating NG words in database",
    words: words.map((w) => w.val),
  });

  try {
    // Clear existing words
    await sql`DELETE FROM ng_words`;

    // // Bulk insert new words if any exist
    // for (const wordObj of words) {
    //   await sql`INSERT INTO ng_words(word) VALUES (${wordObj.val})`;
    // }

    const rawWords = words.map((wordObj) => {
      return {
        word: wordObj.val,
      };
    });

    // 一度だけのバルクインサート
    await sql`
      INSERT INTO ng_words (word)
      ${sql(rawWords, "word")}
    `;

    logger.info({
      operation: "updateNGWordsRepository",
      message: "NG words updated successfully",
    });

    return ok(undefined);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "updateNGWordsRepository",
      error,
      message: `Database error during NG words update: ${msg}`,
    });
    return err(
      new DatabaseError(`NGワード更新中にエラーが発生しました: ${msg}`, error)
    );
  }
};
