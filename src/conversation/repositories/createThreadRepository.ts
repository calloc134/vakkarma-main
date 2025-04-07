import { ok, err } from "neverthrow";

import { DatabaseError } from "../../shared/types/Error";
import {
  createReadThreadId,
  type ReadThreadId,
} from "../domain/read/ReadThreadId";

import type { VakContext } from "../../shared/types/VakContext";
import type { WriteThread } from "../domain/write/WriteThread";
import type { Result } from "neverthrow";

// スレッドを作成するリポジトリ
export const createThreadRepository = async (
  { sql, logger }: VakContext,
  thread: WriteThread
): Promise<Result<ReadThreadId, DatabaseError>> => {
  logger.debug({
    operation: "createThread",
    threadId: thread.id.val,
    threadTitle: thread.title.val,
    message: "Creating new thread in database",
  });

  try {
    const result = await sql<{ id: string }[]>`
          INSERT INTO threads(
              id,
              title,
              posted_at,
              updated_at,
              epoch_id
          )
          VALUES(
              ${thread.id.val}::uuid,
              ${thread.title.val},
              ${thread.postedAt.val},
              ${thread.updatedAt.val},
              ${thread.epochId.val}
          ) RETURNING id
      `;

    if (!result || result.length !== 1) {
      logger.error({
        operation: "createThread",
        threadId: thread.id.val,
        message: "Failed to create thread, invalid database response",
      });
      return err(new DatabaseError("スレッドの作成に失敗しました"));
    }

    const threadIdResult = createReadThreadId(result[0].id);
    if (threadIdResult.isErr()) {
      logger.error({
        operation: "createThread",
        error: threadIdResult.error,
        threadId: thread.id.val,
        message: "Failed to create thread ID from database result",
      });
      return err(threadIdResult.error);
    }

    logger.info({
      operation: "createThread",
      threadId: thread.id.val,
      threadTitle: thread.title.val,
      message: "Thread created successfully",
    });

    return ok(threadIdResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "createThread",
      error,
      threadId: thread.id.val,
      message: `Database error while creating thread: ${message}`,
    });
    return err(
      new DatabaseError(`データベースエラーが発生しました: ${message}`, error)
    );
  }
};
