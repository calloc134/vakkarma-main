import { err, ok } from "neverthrow";
import { Result } from "neverthrow";

import { createWriteBoardName } from "../domain/write/WriteBoardName";
import { createWriteDefaultAuthorName } from "../domain/write/WriteDefaultAuthorName";
import { createWriteLocalRule } from "../domain/write/WriteLocalRule";
import { createWriteMaxContentLength } from "../domain/write/WriteMaxContentLength";
import { createWriteNormalConfig } from "../domain/write/WriteNormalConfig";
import { updateNormalConfigRepository } from "../repositories/updateNormalConfigRepository";

import type { DbContext } from "../../types/DbContext";

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
  const combinedResult = Result.combine([
    createWriteBoardName(boardNameRaw),
    createWriteLocalRule(localRuleRaw),
    createWriteDefaultAuthorName(nanashiNameRaw),
    createWriteMaxContentLength(maxContentLengthRaw),
  ]);

  if (combinedResult.isErr()) {
    return err(combinedResult.error);
  }

  const [boardName, localRule, defaultAuthorName, maxContentLength] =
    combinedResult.value;

  // 今回は値オブジェクトはないので、そのまま
  const config = await createWriteNormalConfig({
    boardName,
    localRule,
    defaultAuthorName,
    maxContentLength,
  });

  if (config.isErr()) {
    return err(config.error);
  }

  const result = await updateNormalConfigRepository(dbContext, config.value);
  if (result.isErr()) {
    return err(result.error);
  }

  return ok(undefined);
};
