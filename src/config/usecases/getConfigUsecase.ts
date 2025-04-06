import { err, ok } from "neverthrow";

import { getNormalConfigRepository } from "../repositories/getNormalConfigRepository";

import type { VakContext } from "../../types/VakContext";
import type { ReadNormalConfig } from "../domain/read/ReadNormalConfig";
import type { Result } from "neverthrow";

export const getConfigUsecase = async (
  dbContext: VakContext
): Promise<Result<ReadNormalConfig, Error>> => {
  const config = await getNormalConfigRepository(dbContext);
  if (config.isErr()) {
    return err(config.error);
  }
  return ok(config.value);
};
