import { err, ok } from "neverthrow";

import { createReadThreadId } from "../domain/read/ReadThreadId";

import type { DbContext } from "../../types/DbContext";
import type { ReadThreadEpochId } from "../domain/read/ReadThreadEpochId";
import type { ReadThreadId } from "../domain/read/ReadThreadId";
import type { Result } from "neverthrow";

export const getThreadIdByThreadEpochIdRepository = async (
  { sql }: DbContext,
  { readThreadEpochId }: { readThreadEpochId: ReadThreadEpochId }
): Promise<Result<ReadThreadId, Error>> => {
  const result = await sql<{ id: string }[]>`
        SELECT
            id
        FROM
            threads
        WHERE
            epoch_id = ${readThreadEpochId.val}
    `;
  if (!result || result.length !== 1) {
    return err(new Error("スレッドIDの取得に失敗しました"));
  }
  const threadIdResult = createReadThreadId(result[0].id);
  if (threadIdResult.isErr()) {
    return err(threadIdResult.error);
  }
  return ok(threadIdResult.value);
};
