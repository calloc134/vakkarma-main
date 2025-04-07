import { err, ok } from "neverthrow";

import { createWriteThreadId } from "../domain/write/WriteThreadId";
import { getAllResponsesByThreadIdRepository } from "../repositories/getAllResponsesByThreadIdRepository";

import type { VakContext } from "../../shared/types/VakContext";

// スレッドについているレスをすべて確認するユースケース
export const getAllResponsesByThreadIdUsecase = async (
  vakContext: VakContext,
  { threadIdRaw }: { threadIdRaw: string }
) => {
  const { logger } = vakContext;

  logger.info({
    operation: "getAllResponsesByThreadId",
    threadId: threadIdRaw,
    message: "Starting thread responses retrieval",
  });

  // ThreadIdを生成
  logger.debug({
    operation: "getAllResponsesByThreadId",
    threadId: threadIdRaw,
    message: "Validating thread ID",
  });

  const threadIdResult = createWriteThreadId(threadIdRaw);
  if (threadIdResult.isErr()) {
    logger.error({
      operation: "getAllResponsesByThreadId",
      error: threadIdResult.error,
      threadId: threadIdRaw,
      message: "Invalid thread ID format",
    });
    return err(threadIdResult.error);
  }

  // スレッド詳細を取得
  logger.debug({
    operation: "getAllResponsesByThreadId",
    threadId: threadIdRaw,
    message: "Fetching thread responses from repository",
  });

  const responsesWithThreadResult = await getAllResponsesByThreadIdRepository(
    vakContext,
    {
      threadId: threadIdResult.value,
    }
  );
  if (responsesWithThreadResult.isErr()) {
    logger.error({
      operation: "getAllResponsesByThreadId",
      error: responsesWithThreadResult.error,
      threadId: threadIdRaw,
      message: "Failed to fetch thread responses",
    });
    return err(responsesWithThreadResult.error);
  }

  logger.info({
    operation: "getAllResponsesByThreadId",
    threadId: threadIdRaw,
    threadTitle: responsesWithThreadResult.value.thread.threadTitle.val,
    responseCount: responsesWithThreadResult.value.responses.length,
    message: "Successfully retrieved thread responses",
  });

  return ok(responsesWithThreadResult.value);
};
