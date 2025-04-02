import { err, ok } from "neverthrow";

import { getBoardConfigRepository } from "../repositories/getBoardConfigRepository";

import type { DbContext } from "../../types/DbContext";
import type { ReadBoardConfig } from "../domain/read/ReadBoardConfig";
import type { Result } from "neverthrow";

export const getBoardConfigUsecase = async (
  dbContext: DbContext
): Promise<Result<ReadBoardConfig, Error>> => {
  const config = await getBoardConfigRepository(dbContext);
  if (config.isErr()) {
    return err(config.error);
  }
  return ok(config.value);
};
