import { err, ok } from "neverthrow";

import { createConfig } from "../domain/write_model/Config";
import { updateConfigRepository } from "../repositories/updateConfigRepository";

import type { DbContext } from "../types/DbContext";
import type { Result } from "neverthrow";

export const updateConfigUsecase = async (
  dbContext: DbContext,
  {
    boardNameRaw,
    localRuleRaw,
    nanashiNameRaw,
    maxContentLengthRaw,
  }: {
    boardNameRaw: string;
    localRuleRaw: string;
    nanashiNameRaw: string;
    maxContentLengthRaw: number;
  }
): Promise<Result<undefined, Error>> => {
  // 今回は値オブジェクトはないので、そのまま
  const config = await createConfig({
    boardName: boardNameRaw,
    localRule: localRuleRaw,
    maxContentLength: maxContentLengthRaw,
    nanashiName: nanashiNameRaw,
  });

  if (config.isErr()) {
    return err(config.error);
  }

  const result = await updateConfigRepository(dbContext, config.value);
  if (result.isErr()) {
    return err(result.error);
  }

  return ok(undefined);
};
