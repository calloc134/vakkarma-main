import { err, ok } from "neverthrow";

import { createWriteThreadEpochId } from "../domain/write/WriteThreadEpochId";
import { getAllResponsesByThreadEpochIdRepository } from "../repositories/getAllResponsesByThreadEpochIdRepository";

import type { VakContext } from "../../shared/types/VakContext";

// スレッドについているレスをすべて確認するユースケース
export const getAllResponsesByThreadEpochIdUsecase = async (
  vakContext: VakContext,
  { threadEpochIdRaw }: { threadEpochIdRaw: string }
) => {
  const { logger } = vakContext;

  logger.info({
    operation: "getAllResponsesByThreadEpochId",
    threadEpochId: threadEpochIdRaw,
    message: "Starting thread responses retrieval by epoch ID",
  });

  // ThreadEpochIdを生成
  logger.debug({
    operation: "getAllResponsesByThreadEpochId",
    threadEpochId: threadEpochIdRaw,
    message: "Validating thread epoch ID",
  });

  const threadEpochId = createWriteThreadEpochId(threadEpochIdRaw);
  if (threadEpochId.isErr()) {
    logger.error({
      operation: "getAllResponsesByThreadEpochId",
      error: threadEpochId.error,
      threadEpochId: threadEpochIdRaw,
      message: "Invalid thread epoch ID format",
    });
    return err(threadEpochId.error);
  }

  // スレッド詳細を取得
  logger.debug({
    operation: "getAllResponsesByThreadEpochId",
    threadEpochId: threadEpochIdRaw,
    message: "Fetching thread responses from repository by epoch ID",
  });

  const responsesWithThreadResult =
    await getAllResponsesByThreadEpochIdRepository(vakContext, {
      threadEpochId: threadEpochId.value,
    });
  if (responsesWithThreadResult.isErr()) {
    logger.error({
      operation: "getAllResponsesByThreadEpochId",
      error: responsesWithThreadResult.error,
      threadEpochId: threadEpochIdRaw,
      message: "Failed to fetch thread responses by epoch ID",
    });
    return err(responsesWithThreadResult.error);
  }

  logger.info({
    operation: "getAllResponsesByThreadEpochId",
    threadEpochId: threadEpochIdRaw,
    threadTitle: responsesWithThreadResult.value.thread.threadTitle.val,
    responseCount: responsesWithThreadResult.value.thread.responseCount,
    message: "Successfully retrieved thread responses by epoch ID",
  });

  return ok(responsesWithThreadResult.value);
};
