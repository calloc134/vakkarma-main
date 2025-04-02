import { err, ok } from "neverthrow";

import { getAllThreadsWithEpochIdRepository } from "../../repositories/getAllThreadsWithEpochIdRepository";

import type { DbContext } from "../../types/DbContext";

export const getAllThreadsWithEpochIdUsecase = async (dbContext: DbContext) => {
  const threads = await getAllThreadsWithEpochIdRepository(dbContext);
  if (threads.isErr()) {
    return err(threads.error);
  }
  return ok(threads.value);
};
