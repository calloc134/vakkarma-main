import { ok, err } from "neverthrow";

import { getNGWordsRepository } from "../repositories/getNGWordsRepository";

import type { VakContext } from "../../shared/types/VakContext";
import type { ReadNGWord } from "../domain/read/ReadNGWord";
import type { Result } from "neverthrow";

export const getNGWordsUsecase = async (
  vakContext: VakContext
): Promise<Result<ReadNGWord[], Error>> => {
  const { logger } = vakContext;
  logger.info({
    operation: "getNGWordsUsecase",
    message: "Starting retrieval of NG words",
  });

  logger.debug({
    operation: "getNGWordsUsecase",
    message: "Fetching NG words from repository",
  });

  const result = await getNGWordsRepository(vakContext);
  if (result.isErr()) {
    logger.error({
      operation: "getNGWordsUsecase",
      error: result.error,
      message: "Failed to fetch NG words",
    });
    return err(result.error);
  }

  logger.info({
    operation: "getNGWordsUsecase",
    message: "NG words retrieved successfully",
  });
  return ok(result.value);
};
