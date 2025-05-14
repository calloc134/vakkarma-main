import { ok, err } from "neverthrow";
import { Result } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../../shared/types/Error";
import { createReadAuthorName } from "../domain/read/ReadAuthorName";
import { createReadHashId } from "../domain/read/ReadHashId";
import { createReadMail } from "../domain/read/ReadMail";
import { createReadPostedAt } from "../domain/read/ReadPostedAt";
import {
  createReadResponse,
  type ReadResponse,
} from "../domain/read/ReadResponse";
import { createReadResponseContent } from "../domain/read/ReadResponseContent";
import { createReadResponseId } from "../domain/read/ReadResponseId";
import { createReadResponseNumber } from "../domain/read/ReadResponseNumber";
import { createReadThreadId } from "../domain/read/ReadThreadId";
import { createReadThreadTitle } from "../domain/read/ReadThreadTitle";
import {
  createReadThreadWithResponses,
  type ReadThreadWithResponses,
} from "../domain/read/ReadThreadWithResponses";

import type { ValidationError } from "../../shared/types/Error";
import type { VakContext } from "../../shared/types/VakContext";
import type { WriteResponseNumber } from "../domain/write/WriteResponseNumber";
import type { WriteThreadId } from "../domain/write/WriteThreadId";

// 指定されたスレッドの最新のレスポンスをcount個取得するリポジトリ
// 便宜上、スレッドタイトルも取得する
export const getLatestResponsesByThreadIdAndCountRepository = async (
  { sql, logger }: VakContext,
  { threadId, count }: { threadId: WriteThreadId; count: WriteResponseNumber }
): Promise<
  Result<
    ReadThreadWithResponses,
    DatabaseError | DataNotFoundError | ValidationError
  >
> => {
  logger.debug({
    operation: "getLatestResponseByThreadId",
    threadId: threadId.val,
    count: count.val,
    message: "Fetching latest responses for thread",
  });

  try {
    // unionなのでSafeQLの推論する型と異なる場合がある
    // やむを得ないがasで型を指定する
    const result = (await sql<
      {
        id: string | null;
        thread_id: string | null;
        response_number: number | null;
        author_name: string | null;
        mail: string | null;
        posted_at: Date | null;
        response_content: string | null;
        hash_id: string | null;
        trip: string | null;
        title: string | null;
        total_count: number | null;
      }[]
    >`
    WITH resp_count AS (
      SELECT thread_id, COUNT(*)::int AS total_count
      FROM responses
      WHERE thread_id = ${threadId.val}::uuid
      GROUP BY thread_id
    ),
    unioned AS (
      (
        SELECT
          r.id, r.thread_id, r.response_number, r.author_name, r.mail,
          r.posted_at, r.response_content, r.hash_id, r.trip, t.title
        FROM responses AS r
        JOIN threads AS t ON r.thread_id = t.id
        WHERE r.thread_id = ${threadId.val}::uuid
        ORDER BY r.response_number DESC
        LIMIT ${count.val}
      )
      UNION ALL
      (
        SELECT
          r.id, r.thread_id, r.response_number, r.author_name, r.mail,
          r.posted_at, r.response_content, r.hash_id, r.trip, t.title
        FROM responses AS r
        JOIN threads AS t ON r.thread_id = t.id
        WHERE r.thread_id = ${threadId.val}::uuid
          AND r.response_number = 1
      )
    )
    SELECT
      u.*,
      rc.total_count
    FROM unioned AS u
    JOIN resp_count AS rc ON rc.thread_id = u.thread_id
    ORDER BY u.response_number ASC
    `) as {
      id: string;
      thread_id: string;
      response_number: number;
      author_name: string;
      mail: string;
      posted_at: Date;
      response_content: string;
      hash_id: string;
      trip: string | null;
      title: string;
      total_count: number | null;
    }[];

    if (!result || result.length === 0) {
      logger.info({
        operation: "getLatestResponseByThreadId",
        threadId: threadId.val,
        message: "No responses found for thread",
      });
      return err(new DataNotFoundError("レスポンスの取得に失敗しました"));
    }

    logger.debug({
      operation: "getLatestResponseByThreadId",
      threadId: threadId.val,
      responseCount: result.length,
      message: "Successfully retrieved latest responses from database",
    });

    // 詰め替え部分
    // すべての投稿でスレッドIDは共通なので、最初のレスポンスから取得
    const threadIdResult = createReadThreadId(result[0].thread_id);
    if (threadIdResult.isErr()) {
      logger.error({
        operation: "getLatestResponseByThreadId",
        threadId: threadId.val,
        error: threadIdResult.error,
        message: "Failed to create thread ID from database result",
      });
      return err(threadIdResult.error);
    }

    // レスポンスを番号順（昇順）に並べ直す
    const sortedResponses = [...result].sort(
      (a, b) => a.response_number - b.response_number
    );

    const responses: ReadResponse[] = [];
    for (const response of sortedResponses) {
      const combinedResult = Result.combine([
        createReadResponseId(response.id),
        createReadResponseNumber(response.response_number),
        createReadAuthorName(response.author_name, response.trip),
        createReadMail(response.mail),
        createReadPostedAt(response.posted_at),
        createReadResponseContent(response.response_content),
        createReadHashId(response.hash_id),
      ]);

      if (combinedResult.isErr()) {
        logger.error({
          operation: "getLatestResponseByThreadId",
          threadId: threadId.val,
          responseId: response.id,
          error: combinedResult.error,
          message: "Failed to create domain objects from database result",
        });
        return err(combinedResult.error);
      }

      const [
        responseId,
        responseNumber,
        authorName,
        mail,
        postedAt,
        responseContent,
        hashId,
      ] = combinedResult.value;

      const responseResult = createReadResponse({
        responseId,
        threadId: threadIdResult.value,
        responseNumber,
        authorName,
        mail,
        postedAt,
        responseContent,
        hashId,
      });

      if (responseResult.isErr()) {
        logger.error({
          operation: "getLatestResponseByThreadId",
          threadId: threadId.val,
          responseId: responseId.val,
          error: responseResult.error,
          message: "Failed to create ReadResponse object",
        });
        return err(responseResult.error);
      }

      responses.push(responseResult.value);
    }

    // スレッドタイトルの取得とバリデーション
    const firstResponse = result[0];
    const threadTitleResult = createReadThreadTitle(firstResponse.title);
    if (threadTitleResult.isErr()) {
      logger.error({
        operation: "getLatestResponseByThreadId",
        threadId: threadId.val,
        threadTitle: firstResponse.title,
        error: threadTitleResult.error,
        message: "Failed to create thread title from database result",
      });
      return err(threadTitleResult.error);
    }

    const threadTitle = threadTitleResult.value;
    // 全レス件数は CTE で取得済み
    if (!firstResponse.total_count) {
      logger.error({
        operation: "getLatestResponseByThreadId",
        threadId: threadId.val,
        responseId: firstResponse.id,
        error: new DataNotFoundError(
          "スレッドの全レス件数が取得できませんでした"
        ),
        message: "Failed to create domain objects from database result",
      });
      return err(new DataNotFoundError("全レス件数の取得に失敗しました"));
    }
    const totalCount = firstResponse.total_count;

    const threadWithResponsesResult = createReadThreadWithResponses(
      threadIdResult.value,
      threadTitle,
      totalCount,
      responses
    );

    if (threadWithResponsesResult.isErr()) {
      logger.error({
        operation: "getLatestResponseByThreadId",
        threadId: threadId.val,
        error: threadWithResponsesResult.error,
        message: "Failed to create thread with responses object",
      });
      return err(threadWithResponsesResult.error);
    }

    logger.info({
      operation: "getLatestResponseByThreadId",
      threadId: threadId.val,
      threadTitle: threadTitleResult.value.val,
      responseCount: responses.length,
      message: "Successfully fetched and processed latest responses for thread",
    });

    return ok(threadWithResponsesResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "getLatestResponseByThreadId",
      threadId: threadId.val,
      error,
      message: `Database error while fetching responses: ${message}`,
    });
    return err(
      new DatabaseError(
        `最新レスポンス取得中にエラーが発生しました: ${message}`,
        error
      )
    );
  }
};
