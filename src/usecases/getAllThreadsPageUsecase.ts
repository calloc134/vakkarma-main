import { err, ok } from "neverthrow";

import { getAllThreadsRepository } from "../repositories/getAllThreadsRepository";

import type { DbContext } from "../types/DbContext";

// すべてのスレッドを取得するユースケース
export const getAllThreadsPageUsecase = async (dbContext: DbContext) => {
  const threadsResult = await getAllThreadsRepository(dbContext);
  if (threadsResult.isErr()) {
    return err(threadsResult.error);
  }

  return ok(threadsResult.value);
};
