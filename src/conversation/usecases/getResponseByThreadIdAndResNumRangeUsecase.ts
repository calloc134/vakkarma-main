import { err, ok } from "neverthrow";

import { createWriteResponseNumber } from "../domain/write/WriteResponseNumber";
import { createWriteThreadId } from "../domain/write/WriteThreadId";
import { getResponseByThreadIdAndResNumRangeRepository } from "../repositories/getResponseByThreadIdAndResNumRangeRepository";

import type { VakContext } from "../../shared/types/VakContext";

// スレッドについている指定範囲のレスを取得するユースケース
export const getResponseByThreadIdAndResNumRangeUsecase = async (
  vakContext: VakContext,
  {
    threadIdRaw,
    startResponseNumberRaw,
    endResponseNumberRaw,
  }: {
    threadIdRaw: string;
    startResponseNumberRaw: number | null;
    endResponseNumberRaw: number | null;
  }
) => {
  const { logger } = vakContext;

  logger.info({
    operation: "getResponseByThreadIdAndResNumRange",
    threadId: threadIdRaw,
    startResponseNumber: startResponseNumberRaw,
    endResponseNumber: endResponseNumberRaw,
    message: "Starting thread responses range retrieval",
  });

  // ThreadIdを生成
  logger.debug({
    operation: "getResponseByThreadIdAndResNumRange",
    threadId: threadIdRaw,
    message: "Validating thread ID",
  });

  const threadIdResult = createWriteThreadId(threadIdRaw);
  if (threadIdResult.isErr()) {
    logger.error({
      operation: "getResponseByThreadIdAndResNumRange",
      error: threadIdResult.error,
      threadId: threadIdRaw,
      message: "Invalid thread ID format",
    });
    return err(threadIdResult.error);
  }

  // StartResponseNumberを検証
  let startResponseNumber = null;
  if (startResponseNumberRaw !== null) {
    logger.debug({
      operation: "getResponseByThreadIdAndResNumRange",
      startResponseNumber: startResponseNumberRaw,
      message: "Validating start response number",
    });

    const startResponseNumberResult = createWriteResponseNumber(
      startResponseNumberRaw
    );
    if (startResponseNumberResult.isErr()) {
      logger.error({
        operation: "getResponseByThreadIdAndResNumRange",
        error: startResponseNumberResult.error,
        startResponseNumber: startResponseNumberRaw,
        message: "Invalid start response number value",
      });
      return err(startResponseNumberResult.error);
    }
    startResponseNumber = startResponseNumberResult.value;
  }

  // EndResponseNumberを検証
  let endResponseNumber = null;
  if (endResponseNumberRaw !== null) {
    logger.debug({
      operation: "getResponseByThreadIdAndResNumRange",
      endResponseNumber: endResponseNumberRaw,
      message: "Validating end response number",
    });

    const endResponseNumberResult =
      createWriteResponseNumber(endResponseNumberRaw);
    if (endResponseNumberResult.isErr()) {
      logger.error({
        operation: "getResponseByThreadIdAndResNumRange",
        error: endResponseNumberResult.error,
        endResponseNumber: endResponseNumberRaw,
        message: "Invalid end response number value",
      });
      return err(endResponseNumberResult.error);
    }
    endResponseNumber = endResponseNumberResult.value;
  }

  // 指定範囲のレスを取得
  logger.debug({
    operation: "getResponseByThreadIdAndResNumRange",
    threadId: threadIdRaw,
    startResponseNumber: startResponseNumberRaw,
    endResponseNumber: endResponseNumberRaw,
    message: "Fetching thread responses in range from repository",
  });

  const responsesWithThreadResult =
    await getResponseByThreadIdAndResNumRangeRepository(vakContext, {
      threadId: threadIdResult.value,
      startResponseNumber,
      endResponseNumber,
    });
  if (responsesWithThreadResult.isErr()) {
    logger.error({
      operation: "getResponseByThreadIdAndResNumRange",
      error: responsesWithThreadResult.error,
      threadId: threadIdRaw,
      startResponseNumber: startResponseNumberRaw,
      endResponseNumber: endResponseNumberRaw,
      message: "Failed to fetch thread responses in range",
    });
    return err(responsesWithThreadResult.error);
  }

  logger.info({
    operation: "getResponseByThreadIdAndResNumRange",
    threadId: threadIdRaw,
    threadTitle: responsesWithThreadResult.value.thread.threadTitle.val,
    responseCount: responsesWithThreadResult.value.thread.responseCount,
    startResponseNumber: startResponseNumberRaw,
    endResponseNumber: endResponseNumberRaw,
    message: "Successfully retrieved thread responses in range",
  });

  return ok(responsesWithThreadResult.value);
};
