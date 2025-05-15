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

// 指定されたスレッドの指定された範囲のレスポンスを取得するリポジトリ
// 便宜上、スレッドタイトルも取得する
export const getResponseByThreadIdAndResNumRangeRepository = async (
  { sql, logger }: VakContext,
  {
    threadId,
    startResponseNumber,
    endResponseNumber,
  }: {
    threadId: WriteThreadId;
    startResponseNumber: WriteResponseNumber | null;
    endResponseNumber: WriteResponseNumber | null;
  }
): Promise<
  Result<
    ReadThreadWithResponses,
    DatabaseError | DataNotFoundError | ValidationError
  >
> => {
  logger.debug({
    operation: "getResponseByThreadIdAndResNumRange",
    threadId: threadId.val,
    startResponseNumber: startResponseNumber?.val ?? "NULL",
    endResponseNumber: endResponseNumber?.val ?? "NULL",
    message: "Fetching responses in range for thread",
  });

  // とりあえずnullならダミー
  const startNumRaw = startResponseNumber?.val ?? 0;
  const endNumRaw = endResponseNumber?.val ?? 10000000;
  const isStartNumNull = startResponseNumber === null;
  const isEndNumNull = endResponseNumber === null;

  try {
    const result = await sql<
      {
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
      }[]
    >`
    WITH resp_count AS (
      SELECT thread_id, COUNT(*)::int AS total_count
      FROM responses
      WHERE thread_id = ${threadId.val}::uuid
      GROUP BY thread_id
    ),
    selected AS (
      SELECT
        r.id, r.thread_id, r.response_number, r.author_name, r.mail,
        r.posted_at, r.response_content, r.hash_id, r.trip, t.title
      FROM responses AS r
      JOIN threads AS t ON r.thread_id = t.id
      WHERE
        r.thread_id = ${threadId.val}::uuid
        AND (
          (${isStartNumNull} OR r.response_number >= ${startNumRaw})
          AND (${isEndNumNull} OR r.response_number <= ${endNumRaw})
        )
        OR r.response_number = 1
    )
    SELECT
      s.*,
      rc.total_count
    FROM selected AS s
    JOIN resp_count AS rc ON rc.thread_id = s.thread_id
    ORDER BY s.response_number ASC
    `;

    if (!result || result.length === 0) {
      logger.info({
        operation: "getResponseByThreadIdAndResNumRange",
        threadId: threadId.val,
        startResponseNumber: startResponseNumber?.val ?? "NULL",
        endResponseNumber: endResponseNumber?.val ?? "NULL",
        message: "No responses found for thread within specified range",
      });
      return err(
        new DataNotFoundError("指定された範囲のレスポンスの取得に失敗しました")
      );
    }

    logger.debug({
      operation: "getResponseByThreadIdAndResNumRange",
      threadId: threadId.val,
      responseCount: result.length,
      message: "Successfully retrieved responses from database",
    });

    // 詰め替え部分
    // すべての投稿でスレッドIDは共通なので、最初のレスポンスから取得
    const threadIdResult = createReadThreadId(result[0].thread_id);
    if (threadIdResult.isErr()) {
      logger.error({
        operation: "getResponseByThreadIdAndResNumRange",
        threadId: threadId.val,
        error: threadIdResult.error,
        message: "Failed to create thread ID from database result",
      });
      return err(threadIdResult.error);
    }

    const responses: ReadResponse[] = [];
    for (const response of result) {
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
          operation: "getResponseByThreadIdAndResNumRange",
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
          operation: "getResponseByThreadIdAndResNumRange",
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
        operation: "getResponseByThreadIdAndResNumRange",
        threadId: threadId.val,
        threadTitle: firstResponse.title,
        error: threadTitleResult.error,
        message: "Failed to create thread title from database result",
      });
      return err(threadTitleResult.error);
    }

    const threadTitle = threadTitleResult.value;
    // 全レス件数は CTE で取得済み
    if (!result[0].total_count) {
      logger.error({
        operation: "getResponseByThreadIdAndResNumRange",
        threadId: threadId.val,
        startResponseNumber: startResponseNumber?.val ?? "NULL",
        endResponseNumber: endResponseNumber?.val ?? "NULL",
        error: new DataNotFoundError(
          "スレッドの全レス件数が取得できませんでした"
        ),
        message: "Failed to retrieve total response count for thread",
      });
      return err(
        new DataNotFoundError("スレッドの全レス件数が取得できませんでした")
      );
    }
    const totalCount = result[0].total_count;

    const threadWithResponsesResult = createReadThreadWithResponses(
      threadIdResult.value,
      threadTitle,
      totalCount,
      responses
    );

    if (threadWithResponsesResult.isErr()) {
      logger.error({
        operation: "getResponseByThreadIdAndResNumRange",
        threadId: threadId.val,
        error: threadWithResponsesResult.error,
        message: "Failed to create thread with responses object",
      });
      return err(threadWithResponsesResult.error);
    }

    logger.info({
      operation: "getResponseByThreadIdAndResNumRange",
      threadId: threadId.val,
      threadTitle: threadTitleResult.value.val,
      responseCount: responses.length,
      startResponseNumber: startResponseNumber?.val ?? "NULL",
      endResponseNumber: endResponseNumber?.val ?? "NULL",
      message:
        "Successfully fetched and processed responses in range for thread",
    });

    return ok(threadWithResponsesResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "getResponseByThreadIdAndResNumRange",
      threadId: threadId.val,
      startResponseNumber: startResponseNumber?.val ?? "NULL",
      endResponseNumber: endResponseNumber?.val ?? "NULL",
      error,
      message: `Database error while fetching responses: ${message}`,
    });
    return err(
      new DatabaseError(
        `レスポンス取得中にエラーが発生しました: ${message}`,
        error
      )
    );
  }
};
