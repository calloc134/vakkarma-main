import { err, ok } from "neverthrow";

import { getAllThreadsRepository } from "../repositories/getAllThreadsRepository";

import type { VakContext } from "../../types/VakContext";

// すべてのスレッドを取得するユースケース
export const getAllThreadsPageUsecase = async (dbContext: VakContext) => {
  const threadsResult = await getAllThreadsRepository(dbContext);
  if (threadsResult.isErr()) {
    return err(threadsResult.error);
  }

  return ok(threadsResult.value);
};
