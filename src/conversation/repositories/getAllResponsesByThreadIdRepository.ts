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
import type { WriteThreadId } from "../domain/write/WriteThreadId";

// 指定されたスレッドのすべてのレスポンスを取得するだけのリポジトリ
// 便宜上、スレッドタイトルも取得する
export const getAllResponsesByThreadIdRepository = async (
  { sql, logger }: VakContext,
  { threadId }: { threadId: WriteThreadId }
): Promise<
  Result<
    ReadThreadWithResponses,
    DatabaseError | DataNotFoundError | ValidationError
  >
> => {
  logger.debug({
    operation: "getAllResponsesByThreadId",
    threadId: threadId.val,
    message: "Fetching all responses for thread",
  });

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
      )
      SELECT
        r.id,
        r.thread_id,
        r.response_number,
        r.author_name,
        r.mail,
        r.posted_at,
        r.response_content,
        r.hash_id,
        r.trip,
        t.title,
        rc.total_count
      FROM responses AS r
      JOIN threads AS t
        ON r.thread_id = t.id
      JOIN resp_count AS rc
        ON rc.thread_id = r.thread_id
      WHERE r.thread_id = ${threadId.val}::uuid
      ORDER BY r.response_number
    `;

    if (!result || result.length === 0) {
      logger.info({
        operation: "getAllResponsesByThreadId",
        threadId: threadId.val,
        message: "No responses found for thread",
      });
      return err(new DataNotFoundError("レスポンスの取得に失敗しました"));
    }

    logger.debug({
      operation: "getAllResponsesByThreadId",
      threadId: threadId.val,
      responseCount: result.length,
      message: "Successfully retrieved responses from database",
    });

    // 詰め替え部分
    // すべての投稿でスレッドIDは共通なので、最初のレスポンスから取得
    const threadIdResult = createReadThreadId(result[0].thread_id);
    if (threadIdResult.isErr()) {
      logger.error({
        operation: "getAllResponsesByThreadId",
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
          operation: "getAllResponsesByThreadId",
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
          operation: "getAllResponsesByThreadId",
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
        operation: "getAllResponsesByThreadId",
        threadId: threadId.val,
        threadTitle: firstResponse.title,
        error: threadTitleResult.error,
        message: "Failed to create thread title from database result",
      });
      return err(threadTitleResult.error);
    }

    if (!result[0].total_count) {
      logger.error({
        operation: "getAllResponsesByThreadId",
        threadId: threadId.val,
        message: "Total count not found in database result",
      });
      return err(
        new DataNotFoundError("スレッドのレスポンス件数が取得できませんでした")
      );
    }
    const totalCount = result[0].total_count; // from resp_count
    const threadWithResponsesResult = createReadThreadWithResponses(
      threadIdResult.value,
      threadTitleResult.value,
      totalCount,
      responses
    );

    if (threadWithResponsesResult.isErr()) {
      logger.error({
        operation: "getAllResponsesByThreadId",
        threadId: threadId.val,
        error: threadWithResponsesResult.error,
        message: "Failed to create thread with responses object",
      });
      return err(threadWithResponsesResult.error);
    }

    logger.info({
      operation: "getAllResponsesByThreadId",
      threadId: threadId.val,
      threadTitle: threadTitleResult.value.val,
      responseCount: responses.length,
      message: "Successfully fetched and processed all responses for thread",
    });

    return ok(threadWithResponsesResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "getAllResponsesByThreadId",
      threadId: threadId.val,
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
