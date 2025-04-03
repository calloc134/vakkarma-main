import { ok, err } from "neverthrow";

import { DatabaseError } from "../../types/Error";

import type { DbContext } from "../../types/DbContext";
import type { WritePostedAt } from "../domain/write/WritePostedAt";
import type { WriteThreadId } from "../domain/write/WriteThreadId";
import type { Result } from "neverthrow";

// スレッドのupdated_atを更新するリポジトリ
// ThreadId・updatedAtを受け取る。
// ThreadIdのみ受け取って操作するのは例外的
export const updateThreadUpdatedAtRepository = async (
  { sql }: DbContext,
  { threadId, updatedAt }: { threadId: WriteThreadId; updatedAt: WritePostedAt }
): Promise<Result<WriteThreadId, DatabaseError>> => {
  try {
    const result = await sql<{ id: string }[]>`
        UPDATE
            threads
        SET
            updated_at = ${updatedAt.val}
        WHERE
            id = ${threadId.val}::uuid RETURNING id
      `;

    if (!result || result.length !== 1) {
      return err(new DatabaseError("スレッドの更新に失敗しました"));
    }

    return ok(threadId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(`更新処理中にエラーが発生しました: ${message}`, error)
    );
  }
};
