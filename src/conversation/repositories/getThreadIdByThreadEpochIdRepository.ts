import { err, ok } from "neverthrow";

import { createReadThreadId } from "../domain/read/ReadThreadId";

import type { VakContext } from "../../shared/types/VakContext";
import type { ReadThreadId } from "../domain/read/ReadThreadId";
import type { WriteThreadEpochId } from "../domain/write/WriteThreadEpochId";
import type { Result } from "neverthrow";

export const getThreadIdByThreadEpochIdRepository = async (
  { sql, logger }: VakContext,
  { threadEpochId }: { threadEpochId: WriteThreadEpochId }
): Promise<Result<ReadThreadId, Error>> => {
  logger.debug({
    operation: "getThreadIdByThreadEpochId",
    threadEpochId: threadEpochId.val,
    message: "Fetching thread ID by epoch ID",
  });

  const result = await sql<{ id: string }[]>`
        SELECT
            id
        FROM
            threads
        WHERE
            epoch_id = ${threadEpochId.val}
    `;
  if (!result || result.length !== 1) {
    logger.error({
      operation: "getThreadIdByThreadEpochId",
      threadEpochId: threadEpochId.val,
      message: "Failed to retrieve thread ID, invalid database response",
    });
    return err(new Error("スレッドIDの取得に失敗しました"));
  }

  logger.debug({
    operation: "getThreadIdByThreadEpochId",
    threadEpochId: threadEpochId.val,
    threadId: result[0].id,
    message: "Thread ID retrieved from database",
  });

  const threadIdResult = createReadThreadId(result[0].id);
  if (threadIdResult.isErr()) {
    logger.error({
      operation: "getThreadIdByThreadEpochId",
      threadEpochId: threadEpochId.val,
      error: threadIdResult.error,
      message: "Failed to create thread ID domain object",
    });
    return err(threadIdResult.error);
  }

  logger.info({
    operation: "getThreadIdByThreadEpochId",
    threadEpochId: threadEpochId.val,
    threadId: threadIdResult.value.val,
    message: "Successfully retrieved thread ID by epoch ID",
  });

  return ok(threadIdResult.value);
};
