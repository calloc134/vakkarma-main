import { err, ok } from "neverthrow";

import { getAllThreadsWithEpochIdRepository } from "../repositories/getAllThreadsWithEpochIdRepository";

import type { VakContext } from "../../types/VakContext";

export const getAllThreadsWithEpochIdUsecase = async (
  dbContext: VakContext
) => {
  const threads = await getAllThreadsWithEpochIdRepository(dbContext);
  if (threads.isErr()) {
    return err(threads.error);
  }
  return ok(threads.value);
};
