import { err, ok } from "neverthrow";

import { createReadThreadId } from "../domain/read/ReadThreadId";

import type { VakContext } from "../../types/VakContext";
import type { ReadThreadId } from "../domain/read/ReadThreadId";
import type { WriteThreadEpochId } from "../domain/write/WriteThreadEpochId";
import type { Result } from "neverthrow";

export const getThreadIdByThreadEpochIdRepository = async (
  { sql }: VakContext,
  { threadEpochId }: { threadEpochId: WriteThreadEpochId }
): Promise<Result<ReadThreadId, Error>> => {
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
  const threadIdResult = createReadThreadId(result[0].id);
  if (threadIdResult.isErr()) {
    return err(threadIdResult.error);
  }
  return ok(threadIdResult.value);
};
