import { ok, err } from "neverthrow";
import { Result } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../../types/Error";
import { createReadPostedAt } from "../domain/read/ReadPostedAt";
import { createReadThread, type ReadThread } from "../domain/read/ReadThread";
import { createReadThreadId } from "../domain/read/ReadThreadId";
import { createReadThreadTitle } from "../domain/read/ReadThreadTitle";

import type { ValidationError } from "../../types/Error";
import type { VakContext } from "../../types/VakContext";

// すべてのスレッドを取得するだけのリポジトリ
export const getAllThreadsRepository = async ({
  sql,
}: VakContext): Promise<
  Result<ReadThread[], DatabaseError | DataNotFoundError | ValidationError>
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
    const threads: ReadThread[] = [];
    for (const thread of result) {
      const combinedResult = Result.combine([
        createReadThreadId(thread.id),
        createReadThreadTitle(thread.title),
        createReadPostedAt(thread.posted_at),
        createReadPostedAt(thread.updated_at),
      ]);
      if (combinedResult.isErr()) {
        return err(combinedResult.error);
      }
      const [threadId, title, postedAt, updatedAt] = combinedResult.value;

      const threadResult = createReadThread({
        id: threadId,
        title,
        postedAt,
        updatedAt,
        countResponse: thread.response_count,
      });
      if (threadResult.isErr()) {
        return err(threadResult.error);
      }

      threads.push(threadResult.value);
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
