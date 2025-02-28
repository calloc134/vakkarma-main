import { ok, err } from "neverthrow";

import { createThreadId } from "../domain/value_object/ThreadId";
import { DatabaseError } from "../types/Error";

import type { ThreadId } from "../domain/value_object/ThreadId";
import type { Thread } from "../domain/write_model/Thread";
import type { DbContext } from "../types/DbContext";
import type { Result } from "neverthrow";

// スレッドを作成するリポジトリ
export const createThreadRepository = async (
  { sql }: DbContext,
  thread: Thread
): Promise<Result<ThreadId, DatabaseError>> => {
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
      return err(new DatabaseError("スレッドの作成に失敗しました"));
    }
    const threadIdResult = createThreadId(result[0].id);
    if (threadIdResult.isErr()) {
      return err(threadIdResult.error);
    }
    return ok(threadIdResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(`データベースエラーが発生しました: ${message}`, error)
    );
  }
};
