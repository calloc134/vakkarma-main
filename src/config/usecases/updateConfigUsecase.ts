import { err, ok } from "neverthrow";
import { Result } from "neverthrow";

import { createWriteBoardName } from "../domain/write/WriteBoardName";
import { createWriteDefaultAuthorName } from "../domain/write/WriteDefaultAuthorName";
import { createWriteLocalRule } from "../domain/write/WriteLocalRule";
import { createWriteMaxContentLength } from "../domain/write/WriteMaxContentLength";
import { createWriteNormalConfig } from "../domain/write/WriteNormalConfig";
import { updateNormalConfigRepository } from "../repositories/updateNormalConfigRepository";

import type { VakContext } from "../../types/VakContext";

export const updateConfigUsecase = async (
  vakContext: VakContext,
  {
    boardNameRaw,
    localRuleRaw,
    defaultAuthorNameRaw,
    maxContentLengthRaw,
  }: {
    boardNameRaw: string;
    localRuleRaw: string;
    defaultAuthorNameRaw: string;
    maxContentLengthRaw: number;
  }
): Promise<Result<undefined, Error>> => {
  const { logger } = vakContext;
  
  logger.info({
    operation: "updateConfig",
    boardName: boardNameRaw,
    defaultAuthorName: defaultAuthorNameRaw,
    maxContentLength: maxContentLengthRaw,
    message: "Starting configuration update"
  });
  
  logger.debug({
    operation: "updateConfig",
    message: "Validating configuration values"
  });
  
  const combinedResult = Result.combine([
    createWriteBoardName(boardNameRaw),
    createWriteLocalRule(localRuleRaw),
    createWriteDefaultAuthorName(defaultAuthorNameRaw),
    createWriteMaxContentLength(maxContentLengthRaw),
  ]);

  if (combinedResult.isErr()) {
    logger.error({
      operation: "updateConfig",
      error: combinedResult.error,
      message: "Configuration validation failed"
    });
    return err(combinedResult.error);
  }

  const [boardName, localRule, defaultAuthorName, maxContentLength] =
    combinedResult.value;

  logger.debug({
    operation: "updateConfig",
    message: "Creating configuration object"
  });
  
  // 今回は値オブジェクトはないので、そのまま
  const config = await createWriteNormalConfig({
    boardName,
    localRule,
    defaultAuthorName,
    maxContentLength,
  });

  if (config.isErr()) {
    logger.error({
      operation: "updateConfig",
      error: config.error,
      message: "Failed to create configuration object"
    });
    return err(config.error);
  }

  logger.debug({
    operation: "updateConfig",
    message: "Updating configuration in database"
  });
  
  const result = await updateNormalConfigRepository(vakContext, config.value);
  if (result.isErr()) {
    logger.error({
      operation: "updateConfig",
      error: result.error,
      message: "Failed to update configuration in database"
    });
    return err(result.error);
  }

  logger.info({
    operation: "updateConfig",
    boardName: boardNameRaw,
    defaultAuthorName: defaultAuthorNameRaw,
    message: "Configuration updated successfully"
  });
  
  return ok(undefined);
};
