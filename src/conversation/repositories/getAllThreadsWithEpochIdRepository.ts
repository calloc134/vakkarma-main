import { ok, err } from "neverthrow";
import { Result } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../../types/Error";
import { createReadPostedAt } from "../domain/read/ReadPostedAt";
import { createReadThreadEpochId } from "../domain/read/ReadThreadEpochId";
import { createReadThreadId } from "../domain/read/ReadThreadId";
import { createReadThreadTitle } from "../domain/read/ReadThreadTitle";
import { createReadThreadWithEpochId } from "../domain/read/ReadThreadWithEpochId";

import type { VakContext } from "../../types/VakContext";
import type { ValidationError } from "../../types/Error";
import type { ReadThreadWithEpochId } from "../domain/read/ReadThreadWithEpochId";

// すべてのスレッドを取得するだけのリポジトリ
export const getAllThreadsWithEpochIdRepository = async ({
  sql,
}: VakContext): Promise<
  Result<
    ReadThreadWithEpochId[],
    DatabaseError | DataNotFoundError | ValidationError
  >
> => {
  try {
    const result = await sql<
      {
        id: string;
        title: string;
        posted_at: Date;
        updated_at: Date;
        epoch_id: string;
        response_count: number;
      }[]
    >`
          SELECT
              t.id,
              t.title,
              t.posted_at,
              t.updated_at,
              t.epoch_id,
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
    const threads: ReadThreadWithEpochId[] = [];
    for (const thread of result) {
      const combinedResult = Result.combine([
        createReadThreadId(thread.id),
        createReadThreadTitle(thread.title),
        createReadPostedAt(thread.posted_at),
        createReadPostedAt(thread.updated_at),
        createReadThreadEpochId(thread.epoch_id),
      ]);
      if (combinedResult.isErr()) {
        return err(combinedResult.error);
      }
      const [threadId, title, postedAt, updatedAt, threadEpochId] =
        combinedResult.value;

      const threadWithEpochIdResult = createReadThreadWithEpochId({
        id: threadId,
        title,
        postedAt,
        updatedAt,
        countResponse: thread.response_count,
        threadEpochId,
      });
      if (threadWithEpochIdResult.isErr()) {
        return err(threadWithEpochIdResult.error);
      }
      threads.push(threadWithEpochIdResult.value);
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
