import { err, ok } from "neverthrow";

import { getBoardConfigRepository } from "../repositories/getBoardConfigRepository";

import type { BoardConfig } from "../domain/read_model/BoardConfig";
import type { DbContext } from "../types/DbContext";
import type { Result } from "neverthrow";

export const getBoardConfigUsecase = async (
  dbContext: DbContext
): Promise<Result<BoardConfig, Error>> => {
  const config = await getBoardConfigRepository(dbContext);
  if (config.isErr()) {
    return err(config.error);
  }
  return ok(config.value);
};
