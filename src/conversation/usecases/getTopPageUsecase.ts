// トップページのユースケース

import { ok, err } from "neverthrow";

import { createWriteThreadId } from "../domain/write/WriteThreadId";
import { getLatest10ThreadsWithResponsesRepository } from "../repositories/getLatest10ThreadsWithResposesRepository";
import { getLatest30ThreadsRepository } from "../repositories/getLatest30ThreadsRepository";

import type { VakContext } from "../../types/VakContext";
import type { ReadResponse } from "../domain/read/ReadResponse";
import type { ReadThread } from "../domain/read/ReadThread";

export const getTopPageUsecase = async (dbContext: VakContext) => {
  const { logger } = dbContext;
  
  logger.info({
    operation: "getTopPageUsecase",
    message: "Starting top page data retrieval"
  });

  // まずスレッド上位30件を取得
  logger.debug({
    operation: "getTopPageUsecase",
    message: "Fetching top 30 threads"
  });
  
  const threadsTop30Result = await getLatest30ThreadsRepository(dbContext);
  if (threadsTop30Result.isErr()) {
    logger.error({
      operation: "getTopPageUsecase",
      error: threadsTop30Result.error,
      message: "Failed to fetch top 30 threads"
    });
    return err(threadsTop30Result.error);
  }
  // これがナビゲーションエリアに表示される

  logger.debug({
    operation: "getTopPageUsecase",
    threadCount: threadsTop30Result.value.length,
    message: "Successfully fetched top 30 threads"
  });

  // 次に、スレッド上位30件から上位10件を取得
  const top10ThreadIdsResult = threadsTop30Result.value
    .slice(0, 10)
    .map((thread) => {
      return thread.id;
    });

  // writeThreadIdの配列に変換
  const top10ThreadIds = top10ThreadIdsResult
    .map((threadId) => {
      return createWriteThreadId(threadId.val);
    })
    .filter((threadId) => {
      return threadId.isOk();
    })
    .map((threadId) => {
      return threadId.value;
    });

  logger.debug({
    operation: "getTopPageUsecase",
    top10ThreadIdsCount: top10ThreadIds.length,
    message: "Extracted top 10 thread IDs for detailed response fetching"
  });

  // スレッド上位10件の詳細を取得
  logger.debug({
    operation: "getTopPageUsecase",
    message: "Fetching responses for top 10 threads"
  });
  
  const responsesTop10 = await getLatest10ThreadsWithResponsesRepository(
    dbContext,
    { threadIds: top10ThreadIds }
  );
  if (responsesTop10.isErr()) {
    logger.error({
      operation: "getTopPageUsecase",
      error: responsesTop10.error,
      message: "Failed to fetch responses for top 10 threads"
    });
    return err(responsesTop10.error);
  }

  logger.debug({
    operation: "getTopPageUsecase",
    responseCount: responsesTop10.value.length,
    message: "Successfully fetched responses for top 10 threads"
  });

  // 上位10件のスレッドのレスについて、先程のふたつを結合して完全版の構造体を作成
  // それぞれのスレッドに対してレスとして表現する構造体を作成
  // まずそれぞれのスレッドについて連想配列を作成
  const threadResponseMap: Map<
    string,
    {
      thread: ReadThread;
      responses: ReadResponse[];
    }
  > = new Map();
  for (const thread of threadsTop30Result.value) {
    threadResponseMap.set(thread.id.val, {
      thread,
      responses: [],
    });
  }

  // 連想配列にレスを追加
  for (const response of responsesTop10.value) {
    const responses = threadResponseMap.get(response.threadId.val);
    if (responses) {
      responses.responses.push(response);
    }
  }

  // 先程の連想配列のすべてのレスを、レス番号で小さい順に並び替える
  for (const [, threadResponse] of threadResponseMap) {
    threadResponse.responses.sort((a, b) => {
      return a.responseNumber.val - b.responseNumber.val;
    });
  }

  // 連想配列を配列にもどす
  const threadResponseArray = Array.from(threadResponseMap.values());

  // 連想配列をupdated_atで降順に並び替える
  threadResponseArray.sort((a, b) => {
    return (
      new Date(b.thread.updatedAt.val).getTime() -
      new Date(a.thread.updatedAt.val).getTime()
    );
  });

  logger.debug({
    operation: "getTopPageUsecase",
    processedThreadCount: threadResponseArray.length,
    message: "Data processing completed for top page display"
  });

  // スレッド上位30件と、
  // スレッド上位10件についてはレスを含めた構造体を返す
  logger.info({
    operation: "getTopPageUsecase",
    threadCount: threadsTop30Result.value.length,
    detailedThreadCount: threadResponseArray.length,
    message: "Successfully retrieved and processed top page data"
  });
  
  return ok({
    threadTop30: threadsTop30Result.value,
    responsesTop10: threadResponseArray,
  });
};
