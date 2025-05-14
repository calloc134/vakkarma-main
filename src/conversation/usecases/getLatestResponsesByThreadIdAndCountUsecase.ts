import { err, ok } from "neverthrow";

import { createWriteResponseNumber } from "../domain/write/WriteResponseNumber";
import { createWriteThreadId } from "../domain/write/WriteThreadId";
import { getLatestResponsesByThreadIdAndCountRepository } from "../repositories/getLatestResponsesByThreadIdAndCountRepository";

import type { VakContext } from "../../shared/types/VakContext";

// スレッドについている最新のレスを指定件数取得するユースケース
export const getLatestResponsesByThreadIdAndCountUsecase = async (
  vakContext: VakContext,
  { threadIdRaw, countRaw }: { threadIdRaw: string; countRaw: number }
) => {
  const { logger } = vakContext;

  logger.info({
    operation: "getLatestResponseByThreadIdAndCount",
    threadId: threadIdRaw,
    count: countRaw,
    message: "Starting latest thread responses retrieval",
  });

  // ThreadIdを生成
  logger.debug({
    operation: "getLatestResponseByThreadIdAndCount",
    threadId: threadIdRaw,
    message: "Validating thread ID",
  });

  const threadIdResult = createWriteThreadId(threadIdRaw);
  if (threadIdResult.isErr()) {
    logger.error({
      operation: "getLatestResponseByThreadIdAndCount",
      error: threadIdResult.error,
      threadId: threadIdRaw,
      message: "Invalid thread ID format",
    });
    return err(threadIdResult.error);
  }

  // Countを検証
  logger.debug({
    operation: "getLatestResponseByThreadIdAndCount",
    count: countRaw,
    message: "Validating response count",
  });

  const countResult = createWriteResponseNumber(countRaw);
  if (countResult.isErr()) {
    logger.error({
      operation: "getLatestResponseByThreadIdAndCount",
      error: countResult.error,
      count: countRaw,
      message: "Invalid response count value",
    });
    return err(countResult.error);
  }

  // 最新のレスを指定件数取得
  logger.debug({
    operation: "getLatestResponseByThreadIdAndCount",
    threadId: threadIdRaw,
    count: countRaw,
    message: "Fetching latest thread responses from repository",
  });

  const responsesWithThreadResult =
    await getLatestResponsesByThreadIdAndCountRepository(vakContext, {
      threadId: threadIdResult.value,
      count: countResult.value,
    });
  if (responsesWithThreadResult.isErr()) {
    logger.error({
      operation: "getLatestResponseByThreadIdAndCount",
      error: responsesWithThreadResult.error,
      threadId: threadIdRaw,
      count: countRaw,
      message: "Failed to fetch latest thread responses",
    });
    return err(responsesWithThreadResult.error);
  }

  logger.info({
    operation: "getLatestResponseByThreadIdAndCount",
    threadId: threadIdRaw,
    threadTitle: responsesWithThreadResult.value.thread.threadTitle.val,
    count: countRaw,
    responseCount: responsesWithThreadResult.value.thread.responseCount,
    message: "Successfully retrieved latest thread responses",
  });

  return ok(responsesWithThreadResult.value);
};
