// トップページのユースケース

import { ok, err } from "neverthrow";

import { getLatest10ThreadsWithResponsesRepository } from "../repositories/getLatest10ThreadsWithResponsesRepository";
import { getLatest30ThreadsRepository } from "../repositories/getLatest30ThreadsRepository";

import type { ResponseForRead } from "../domain/read_model/ResponseForRead";
import type { ThreadForRead } from "../domain/read_model/ThreadForRead";
import type { DbContext } from "../types/DbContext";

export const getTopPageUsecase = async (dbContext: DbContext) => {
  // // 掲示板のconfigを取得
  // const configResult = await getConfigRepository(dbContext);
  // if (configResult.isErr()) {
  //   return err(configResult.error);
  // }

  // まずスレッド上位30件を取得
  const threadsTop30Result = await getLatest30ThreadsRepository(dbContext);
  if (threadsTop30Result.isErr()) {
    return err(threadsTop30Result.error);
  }
  // これがナビゲーションエリアに表示される

  // 次に、スレッド上位30件から上位10件を取得
  const top10ThreadIdsResult = threadsTop30Result.value
    .slice(0, 10)
    .map((thread) => {
      return thread.threadId;
    });

  // スレッド上位10件の詳細を取得
  const responsesTop10 = await getLatest10ThreadsWithResponsesRepository(
    dbContext,
    { threadIds: top10ThreadIdsResult }
  );
  if (responsesTop10.isErr()) {
    return err(responsesTop10.error);
  }

  // 上位10件のスレッドのレスについて、先程のふたつを結合して完全版の構造体を作成
  // それぞれのスレッドに対してレスとして表現する構造体を作成
  // まずそれぞれのスレッドについて連想配列を作成
  const threadResponseMap: Map<
    string,
    {
      thread: ThreadForRead;
      responses: ResponseForRead[];
    }
  > = new Map();
  for (const thread of threadsTop30Result.value) {
    threadResponseMap.set(thread.threadId.val, {
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

  // スレッド上位30件と、
  // スレッド上位10件についてはレスを含めた構造体を返す
  return ok({
    // config: configResult.value,
    threadTop30: threadsTop30Result.value,
    responsesTop10: threadResponseArray,
  });
};
