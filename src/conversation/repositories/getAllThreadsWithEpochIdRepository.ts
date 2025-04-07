import { ok, err } from "neverthrow";
import { Result } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../../shared/types/Error";
import { createReadPostedAt } from "../domain/read/ReadPostedAt";
import { createReadThreadEpochId } from "../domain/read/ReadThreadEpochId";
import { createReadThreadId } from "../domain/read/ReadThreadId";
import { createReadThreadTitle } from "../domain/read/ReadThreadTitle";
import { createReadThreadWithEpochId } from "../domain/read/ReadThreadWithEpochId";

import type { ValidationError } from "../../shared/types/Error";
import type { VakContext } from "../../shared/types/VakContext";
import type { ReadThreadWithEpochId } from "../domain/read/ReadThreadWithEpochId";

// すべてのスレッドを取得するだけのリポジトリ
export const getAllThreadsWithEpochIdRepository = async ({
  sql,
  logger,
}: VakContext): Promise<
  Result<
    ReadThreadWithEpochId[],
    DatabaseError | DataNotFoundError | ValidationError
  >
> => {
  logger.debug({
    operation: "getAllThreadsWithEpochId",
    message: "Fetching all threads with epoch IDs",
  });

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
      logger.info({
        operation: "getAllThreadsWithEpochId",
        message: "No threads found in database",
      });
      return err(new DataNotFoundError("スレッドの取得に失敗しました"));
    }

    logger.debug({
      operation: "getAllThreadsWithEpochId",
      count: result.length,
      message: "Successfully retrieved threads from database",
    });

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
        logger.error({
          operation: "getAllThreadsWithEpochId",
          error: combinedResult.error,
          threadId: thread.id,
          message: "Failed to create domain objects from database result",
        });
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
        logger.error({
          operation: "getAllThreadsWithEpochId",
          error: threadWithEpochIdResult.error,
          threadId: threadId.val,
          message: "Failed to create ReadThreadWithEpochId object",
        });
        return err(threadWithEpochIdResult.error);
      }
      threads.push(threadWithEpochIdResult.value);
    }

    logger.info({
      operation: "getAllThreadsWithEpochId",
      threadCount: threads.length,
      message: "Successfully fetched and processed all threads with epoch IDs",
    });

    return ok(threads);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "getAllThreadsWithEpochId",
      error,
      message: `Database error while fetching threads: ${message}`,
    });
    return err(
      new DatabaseError(
        `スレッド取得中にエラーが発生しました: ${message}`,
        error
      )
    );
  }
};
