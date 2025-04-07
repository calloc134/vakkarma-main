import { err, ok } from "neverthrow";

import { getAllThreadsRepository } from "../repositories/getAllThreadsRepository";

import type { VakContext } from "../../types/VakContext";

// すべてのスレッドを取得するユースケース
export const getAllThreadsPageUsecase = async (dbContext: VakContext) => {
  const { logger } = dbContext;
  
  logger.info({
    operation: "getAllThreadsPage",
    message: "Starting all threads retrieval"
  });
  
  logger.debug({
    operation: "getAllThreadsPage",
    message: "Fetching all threads from repository"
  });
  
  const threadsResult = await getAllThreadsRepository(dbContext);
  if (threadsResult.isErr()) {
    logger.error({
      operation: "getAllThreadsPage",
      error: threadsResult.error,
      message: "Failed to fetch all threads"
    });
    return err(threadsResult.error);
  }

  logger.info({
    operation: "getAllThreadsPage",
    threadCount: threadsResult.value.length,
    message: "Successfully retrieved all threads"
  });
  
  return ok(threadsResult.value);
};
