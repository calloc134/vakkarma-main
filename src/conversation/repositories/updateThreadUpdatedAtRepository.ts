import { ok, err } from "neverthrow";

import { DatabaseError } from "../../shared/types/Error";
import { createReadThreadId } from "../domain/read/ReadThreadId";
import { type WriteThreadId } from "../domain/write/WriteThreadId";

import type { VakContext } from "../../shared/types/VakContext";
import type { ReadThreadId } from "../domain/read/ReadThreadId";
import type { WritePostedAt } from "../domain/write/WritePostedAt";
import type { Result } from "neverthrow";

// スレッドのupdated_atを更新するリポジトリ
// ThreadId・updatedAtを受け取る。
// ThreadIdのみ受け取って操作するのは例外的
export const updateThreadUpdatedAtRepository = async (
  { sql, logger }: VakContext,
  { threadId, updatedAt }: { threadId: WriteThreadId; updatedAt: WritePostedAt }
): Promise<Result<ReadThreadId, DatabaseError>> => {
  logger.debug({
    operation: "updateThreadUpdatedAt",
    threadId: threadId.val,
    updatedAt: updatedAt.val,
    message: "Updating thread timestamp",
  });

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
      logger.error({
        operation: "updateThreadUpdatedAt",
        threadId: threadId.val,
        message: "Failed to update thread timestamp, invalid database response",
      });
      return err(new DatabaseError("スレッドの更新に失敗しました"));
    }

    logger.info({
      operation: "updateThreadUpdatedAt",
      threadId: threadId.val,
      updatedAt: updatedAt.val,
      message: "Thread timestamp updated successfully",
    });

    const readThreadIdResult = createReadThreadId(result[0].id);
    if (readThreadIdResult.isErr()) {
      logger.error({
        operation: "updateThreadUpdatedAt",
        threadId: threadId.val,
        message: "Failed to create WriteThreadId from database response",
      });
      return err(readThreadIdResult.error);
    }

    return ok(readThreadIdResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "updateThreadUpdatedAt",
      threadId: threadId.val,
      error,
      message: `Database error while updating thread timestamp: ${message}`,
    });
    return err(
      new DatabaseError(`更新処理中にエラーが発生しました: ${message}`, error)
    );
  }
};
