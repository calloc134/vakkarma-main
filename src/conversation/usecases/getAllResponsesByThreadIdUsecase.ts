import { err, ok } from "neverthrow";

import { createWriteThreadId } from "../domain/write/WriteThreadId";
import { getAllResponsesByThreadIdRepository } from "../repositories/getAllResponsesByThreadIdRepository";

import type { VakContext } from "../../types/VakContext";

// スレッドについているレスをすべて確認するユースケース
export const getAllResponsesByThreadIdUsecase = async (
  dbContext: VakContext,
  { threadIdRaw }: { threadIdRaw: string }
) => {
  // ThreadIdを生成
  const threadIdResult = createWriteThreadId(threadIdRaw);
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
