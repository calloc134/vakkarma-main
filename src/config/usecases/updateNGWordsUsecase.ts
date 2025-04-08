import { ok, err } from "neverthrow";

import { createWriteNGWord } from "../domain/write/WriteNGWord";
import { updateNGWordsRepository } from "../repositories/updateNGWordsRepository";

import type { VakContext } from "../../shared/types/VakContext";
import type { WriteNGWord } from "../domain/write/WriteNGWord";
import type { Result } from "neverthrow";

export const updateNGWordsUsecase = async (
  vakContext: VakContext,
  rawWords: string[]
): Promise<Result<undefined, Error>> => {
  const { logger } = vakContext;
  logger.info({
    operation: "updateNGWordsUsecase",
    message: "Starting NG words update",
    rawWords,
  });

  const ngWords: WriteNGWord[] = [];

  for (const word of rawWords) {
    const wordResult = createWriteNGWord(word);
    if (wordResult.isErr()) {
      logger.error({
        operation: "updateNGWordsUsecase",
        error: wordResult.error,
        message: "Invalid NG word value",
      });
      return err(wordResult.error);
    }
    ngWords.push(wordResult.value);
  }

  logger.debug({
    operation: "updateNGWordsUsecase",
    message: "NG words validated successfully",
  });

  // Update repository with validated words
  const result = await updateNGWordsRepository(vakContext, ngWords);
  if (result.isErr()) {
    logger.error({
      operation: "updateNGWordsUsecase",
      error: result.error,
      message: "Failed to update NG words in repository",
    });
    return err(result.error);
  }

  logger.info({
    operation: "updateNGWordsUsecase",
    message: "NG words updated successfully",
  });
  return ok(undefined);
};
