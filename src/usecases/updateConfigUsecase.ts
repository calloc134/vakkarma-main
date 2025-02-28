import { err, ok } from "neverthrow";

import { createConfig } from "../domain/write_model/Config";
import { getCurrentPasswordConfigRepository } from "../repositories/getCurrentPasswordConfigRepository";
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
    inputPasswordRaw,
  }: {
    boardNameRaw: string;
    localRuleRaw: string;
    nanashiNameRaw: string;
    maxContentLengthRaw: number;
    inputPasswordRaw: string;
  }
): Promise<Result<undefined, Error>> => {
  // 今回は値オブジェクトはないので、そのまま
  const config = await createConfig({
    boardName: boardNameRaw,
    localRule: localRuleRaw,
    maxContentLength: maxContentLengthRaw,
    nanashiName: nanashiNameRaw,
    inputPassword: inputPasswordRaw,
    getCurrentPasswordHash: async () => {
      const currentPasswordResult = await getCurrentPasswordConfigRepository(
        dbContext
      );
      if (currentPasswordResult.isErr()) {
        return err(currentPasswordResult.error);
      }
      return ok(currentPasswordResult.value);
    },
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
