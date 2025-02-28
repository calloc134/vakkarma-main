import { ok, err } from "neverthrow";

import { createPostedAt } from "../domain/value_object/PostedAt";
import { createThreadId } from "../domain/value_object/ThreadId";
import { createThreadTitle } from "../domain/value_object/ThreadTitle";
import { DatabaseError, DataNotFoundError } from "../types/Error";

import type { ThreadForRead } from "../domain/read_model/ThreadForRead";
import type { DbContext } from "../types/DbContext";
import type { ValidationError } from "../types/Error";
import type { Result } from "neverthrow";

// updated_atが新しい順に30個のスレッドを取得
// かつ、新しい先頭の10個は、レスポンスの内容も含めて取得
// レスポンスの内容は、先頭のレスポンス一つと、posted_atが新しい順に10個

// findLatestThreadsRepositoryとfindLatestResponsesRepositoryを組み合わせて実装
// まずはfindLatestThreadsRepositoryを実装
export const getLatest30ThreadsRepository = async ({
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
        LIMIT 30
    `;

    if (!result || result.length === 0) {
      return err(new DataNotFoundError("スレッドの取得に失敗しました"));
    }

    // 詰め替え部分
    const threads: ThreadForRead[] = [];
    for (const thread of result) {
      const threadIdResult = createThreadId(thread.id);
      if (threadIdResult.isErr()) return err(threadIdResult.error);

      const titleResult = createThreadTitle(thread.title);
      if (titleResult.isErr()) return err(titleResult.error);

      const postedAtResult = createPostedAt(thread.posted_at);
      if (postedAtResult.isErr()) return err(postedAtResult.error);

      const updatedAt = createPostedAt(thread.updated_at);
      if (updatedAt.isErr()) return err(updatedAt.error);

      threads.push({
        _type: "ThreadForRead",
        threadId: threadIdResult.value,
        title: titleResult.value,
        postedAt: postedAtResult.value,
        updatedAt: updatedAt.value,
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
