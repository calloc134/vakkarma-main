import { ok, err } from "neverthrow";

import { createReadNGWord } from "../domain/read/ReadNGWord";

import type { VakContext } from "../../shared/types/VakContext";
import type { ReadNGWord } from "../domain/read/ReadNGWord";
import type { Result } from "neverthrow";

export const getNGWordsRepository = async (
  vakContext: VakContext
): Promise<Result<ReadNGWord[], Error>> => {
  const { sql, logger } = vakContext;

  logger.debug({
    operation: "getNGWordsRepository",
    message: "Fetching NG words from database",
  });

  try {
    const result = await sql<{ word: string }[]>`SELECT word FROM ng_words`;
    if (!result) {
      logger.error({
        operation: "getNGWordsRepository",
        message: "No NG words found",
      });
      return err(new Error("NG words not found"));
    }

    const ngWords: ReadNGWord[] = [];
    for (const row of result) {
      const wordResult = createReadNGWord(row.word);
      if (wordResult.isErr()) {
        logger.error({
          operation: "getNGWordsRepository",
          error: wordResult.error,
          message: "Invalid NG word value",
        });
        return err(wordResult.error);
      }
      ngWords.push(wordResult.value);
    }

    logger.info({
      operation: "getNGWordsRepository",
      message: "NG words fetched successfully",
    });
    return ok(ngWords);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "getNGWordsRepository",
      error,
      message: `Database error while fetching NG words: ${msg}`,
    });
    return err(new Error(`Database error while fetching NG words: ${msg}`));
  }
};
