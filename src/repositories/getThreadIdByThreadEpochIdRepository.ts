import { err, ok } from "neverthrow";

import { createThreadId } from "../domain/value_object/ThreadId";

import type { ThreadEpochId } from "../domain/value_object/ThreadEpochId";
import type { ThreadId } from "../domain/value_object/ThreadId";
import type { DbContext } from "../types/DbContext";
import type { Result } from "neverthrow";

export const getThreadIdByThreadEpochIdRepository = async (
  { sql }: DbContext,
  { threadEpochId }: { threadEpochId: ThreadEpochId }
): Promise<Result<ThreadId, Error>> => {
  const result = await sql<{ id: string }[]>`
        SELECT
            id
        FROM
            threads
        WHERE
            epoch_id = ${threadEpochId.val}
    `;
  if (!result || result.length !== 1) {
    return err(new Error("スレッドIDの取得に失敗しました"));
  }
  const threadIdResult = createThreadId(result[0].id);
  if (threadIdResult.isErr()) {
    return err(threadIdResult.error);
  }
  return ok(threadIdResult.value);
};
