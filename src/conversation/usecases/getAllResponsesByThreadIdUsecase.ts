import { err, ok } from "neverthrow";

import { createReadThreadId } from "../domain/read/ReadThreadId";
import { getAllResponsesByThreadIdRepository } from "../repositories/getAllResponsesByThreadIdRepository";

import type { DbContext } from "../../types/DbContext";

// スレッドについているレスをすべて確認するユースケース
export const getAllResponsesByThreadIdUsecase = async (
  dbContext: DbContext,
  { threadIdRaw }: { threadIdRaw: string }
) => {
  // ThreadIdを生成
  const threadIdResult = createReadThreadId(threadIdRaw);
  if (threadIdResult.isErr()) {
    return err(threadIdResult.error);
  }
  // スレッド詳細を取得
  const responsesWithThreadResult = await getAllResponsesByThreadIdRepository(
    dbContext,
    {
      threadId: threadIdResult.value,
    }
  );
  if (responsesWithThreadResult.isErr()) {
    return err(responsesWithThreadResult.error);
  }

  return ok(responsesWithThreadResult.value);
};
