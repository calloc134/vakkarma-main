import { err, ok } from "neverthrow";

import { createWriteThreadEpochId } from "../domain/write/WriteThreadEpochId";
import { getAllResponsesByThreadEpochIdRepository } from "../repositories/getAllResponsesByThreadEpochIdRepository";

import type { DbContext } from "../../types/DbContext";

// スレッドについているレスをすべて確認するユースケース
export const getAllResponsesByThreadEpochIdUsecase = async (
  dbContext: DbContext,
  { threadEpochIdRaw }: { threadEpochIdRaw: string }
) => {
  // ThreadEpochIdを生成
  const threadEpochId = createWriteThreadEpochId(threadEpochIdRaw);
  if (threadEpochId.isErr()) {
    return err(threadEpochId.error);
  }
  // スレッド詳細を取得
  const responsesWithThreadResult =
    await getAllResponsesByThreadEpochIdRepository(dbContext, {
      threadEpochId: threadEpochId.value,
    });
  if (responsesWithThreadResult.isErr()) {
    return err(responsesWithThreadResult.error);
  }

  return ok(responsesWithThreadResult.value);
};
