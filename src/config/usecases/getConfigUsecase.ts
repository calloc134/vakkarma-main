import { err, ok } from "neverthrow";

import { getConfigRepository } from "../../repositories/getConfigRepository";

import type { Config } from "../../domain/write_model/Config";
import type { DbContext } from "../../types/DbContext";
import type { Result } from "neverthrow";

export const getConfigUsecase = async (
  dbContext: DbContext
): Promise<Result<Config, Error>> => {
  const config = await getConfigRepository(dbContext);
  if (config.isErr()) {
    return err(config.error);
  }
  return ok(config.value);
};
