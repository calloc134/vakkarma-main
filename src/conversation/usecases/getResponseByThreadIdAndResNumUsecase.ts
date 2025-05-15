import { err, ok } from "neverthrow";

import { createWriteResponseNumber } from "../domain/write/WriteResponseNumber";
import { createWriteThreadId } from "../domain/write/WriteThreadId";
import { getResponseByThreadIdAndResNumRepository } from "../repositories/getResponseByThreadIdAndResNumRepository";

import type { VakContext } from "../../shared/types/VakContext";

// スレッドの特定のレス番号のレスポンスを取得するユースケース
export const getResponseByThreadIdAndResNumUsecase = async (
  vakContext: VakContext,
  {
    threadIdRaw,
    responseNumberRaw,
  }: { threadIdRaw: string; responseNumberRaw: number }
) => {
  const { logger } = vakContext;

  logger.info({
    operation: "getResponseByThreadIdAndResNum",
    threadId: threadIdRaw,
    responseNumber: responseNumberRaw,
    message: "Starting response retrieval by thread ID and response number",
  });

  // ThreadIdを生成
  logger.debug({
    operation: "getResponseByThreadIdAndResNum",
    threadId: threadIdRaw,
    message: "Validating thread ID",
  });

  const threadIdResult = createWriteThreadId(threadIdRaw);
  if (threadIdResult.isErr()) {
    logger.error({
      operation: "getResponseByThreadIdAndResNum",
      error: threadIdResult.error,
      threadId: threadIdRaw,
      message: "Invalid thread ID format",
    });
    return err(threadIdResult.error);
  }

  // レスポンス番号を生成
  logger.debug({
    operation: "getResponseByThreadIdAndResNum",
    responseNumber: responseNumberRaw,
    message: "Validating response number",
  });

  const responseNumberResult = createWriteResponseNumber(responseNumberRaw);
  if (responseNumberResult.isErr()) {
    logger.error({
      operation: "getResponseByThreadIdAndResNum",
      error: responseNumberResult.error,
      responseNumber: responseNumberRaw,
      message: "Invalid response number format",
    });
    return err(responseNumberResult.error);
  }

  // 特定のレスポンスを取得
  logger.debug({
    operation: "getResponseByThreadIdAndResNum",
    threadId: threadIdRaw,
    responseNumber: responseNumberRaw,
    message: "Fetching specific response from repository",
  });

  const responseResult = await getResponseByThreadIdAndResNumRepository(
    vakContext,
    {
      threadId: threadIdResult.value,
      responseNumber: responseNumberResult.value,
    }
  );
  if (responseResult.isErr()) {
    logger.error({
      operation: "getResponseByThreadIdAndResNum",
      error: responseResult.error,
      threadId: threadIdRaw,
      responseNumber: responseNumberRaw,
      message: "Failed to fetch response",
    });
    return err(responseResult.error);
  }

  logger.info({
    operation: "getResponseByThreadIdAndResNum",
    threadId: threadIdRaw,
    responseNumber: responseNumberRaw,
    threadTitle: responseResult.value.thread.threadTitle.val,
    responseCount: responseResult.value.thread.responseCount,
    message: "Successfully retrieved response by thread ID and response number",
  });

  return ok(responseResult.value);
};
