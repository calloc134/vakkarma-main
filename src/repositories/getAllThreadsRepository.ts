import { ok, err } from "neverthrow";

import { createPostedAt } from "../domain/value_object/PostedAt";
import { createThreadId } from "../domain/value_object/ThreadId";
import { createThreadTitle } from "../domain/value_object/ThreadTitle";
import { DatabaseError, DataNotFoundError } from "../types/Error";

import type { ThreadForRead } from "../domain/read_model/ThreadForRead";
import type { DbContext } from "../types/DbContext";
import type { ValidationError } from "../types/Error";
import type { Result } from "neverthrow";

// すべてのスレッドを取得するだけのリポジトリ
export const getAllThreadsRepository = async ({
  sql,
}: DbContext): Promise<
  Result<ThreadForRead[], DatabaseError | DataNotFoundError | ValidationError>
> => {
  try {
    const result = await sql<
      {
        id: string;
        title: string;
        posted_at: Date;
        updated_at: Date;
        response_count: number;
      }[]
    >`
          SELECT
              t.id,
              t.title,
              t.posted_at,
              t.updated_at,
              COUNT(r.id)::int as response_count
          FROM
              threads as t
              LEFT JOIN
                  responses as r
              ON  t.id = r.thread_id
          GROUP BY
              t.id,
              t.title
          ORDER BY
              t.updated_at DESC
      `;

    if (!result || result.length === 0) {
      return err(new DataNotFoundError("スレッドの取得に失敗しました"));
    }

    // 詰め替え部分
    const threads: ThreadForRead[] = [];
    for (const thread of result) {
      const threadIdResult = createThreadId(thread.id);
      if (threadIdResult.isErr()) return err(threadIdResult.error);

      const title = createThreadTitle(thread.title);
      if (title.isErr()) return err(title.error);

      const postedAtResult = createPostedAt(thread.posted_at);
      if (postedAtResult.isErr()) return err(postedAtResult.error);

      const updatedAtResult = createPostedAt(thread.updated_at);
      if (updatedAtResult.isErr()) return err(updatedAtResult.error);

      threads.push({
        _type: "ThreadForRead",
        threadId: threadIdResult.value,
        title: title.value,
        postedAt: postedAtResult.value,
        updatedAt: updatedAtResult.value,
        countResponse: thread.response_count,
      });
    }

    return ok(threads);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(
        `スレッド取得中にエラーが発生しました: ${message}`,
        error
      )
    );
  }
};
