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

// 指定されたスレッドの特定のレスポンス番号に対応するレスポンスを取得するリポジトリ
// 便宜上、スレッドタイトルも取得する
export const getResponseByThreadIdAndResNumRepository = async (
  { sql, logger }: VakContext,
  {
    threadId,
    responseNumber,
  }: {
    threadId: WriteThreadId;
    responseNumber: WriteResponseNumber;
  }
): Promise<
  Result<
    ReadThreadWithResponses,
    DatabaseError | DataNotFoundError | ValidationError
  >
> => {
  logger.debug({
    operation: "getResponseByThreadIdAndResNum",
    threadId: threadId.val,
    responseNumber: responseNumber.val,
    message: "Fetching specific response for thread",
  });

  try {
    const rows = await sql<
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
        AND r.response_number = ${responseNumber.val}
      LIMIT 1
    )
    SELECT
      s.*,
      rc.total_count
    FROM selected AS s
    JOIN resp_count AS rc ON rc.thread_id = s.thread_id
    `;

    if (!rows || rows.length !== 1) {
      logger.info({
        operation: "getResponseByThreadIdAndResNum",
        threadId: threadId.val,
        responseNumber: responseNumber.val,
        message:
          "Response not found for the given thread ID and response number",
      });
      return err(
        new DataNotFoundError("指定されたレスポンスの取得に失敗しました")
      );
    }

    logger.debug({
      operation: "getResponseByThreadIdAndResNum",
      threadId: threadId.val,
      responseNumber: responseNumber.val,
      message: "Successfully retrieved response from database",
    });

    // 詰め替え部分
    const response = rows[0];

    // レスポンスの各フィールドのバリデーションと作成
    const combinedResult = Result.combine([
      createReadThreadId(response.thread_id),
      createReadThreadTitle(response.title),
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
        operation: "getResponseByThreadIdAndResNum",
        threadId: threadId.val,
        responseNumber: responseNumber.val,
        responseId: response.id,
        error: combinedResult.error,
        message: "Failed to create domain objects from database result",
      });
      return err(combinedResult.error);
    }

    const [
      readThreadId,
      threadTitle,
      responseId,
      readResponseNumber,
      authorName,
      mail,
      postedAt,
      responseContent,
      hashId,
    ] = combinedResult.value;

    const responseResult = createReadResponse({
      responseId,
      threadId: readThreadId,
      responseNumber: readResponseNumber,
      authorName,
      mail,
      postedAt,
      responseContent,
      hashId,
    });

    if (responseResult.isErr()) {
      logger.error({
        operation: "getResponseByThreadIdAndResNum",
        threadId: threadId.val,
        responseNumber: responseNumber.val,
        responseId: response.id,
        error: responseResult.error,
        message: "Failed to create ReadResponse object",
      });
      return err(responseResult.error);
    }

    // 単一のレスポンスを配列として渡す
    const responses: ReadResponse[] = [responseResult.value];

    // 全レス件数は CTE で取得済み
    if (!response.total_count) {
      logger.error({
        operation: "getResponseByThreadIdAndResNum",
        threadId: threadId.val,
        responseNumber: responseNumber.val,
        error: new DataNotFoundError(
          "スレッドの全レス件数が取得できませんでした"
        ),
        message: "Failed to get total count of responses",
      });
      return err(
        new DataNotFoundError("スレッドの全レス件数が取得できませんでした")
      );
    }
    const totalCount = response.total_count;

    const threadWithResponsesResult = createReadThreadWithResponses(
      readThreadId,
      threadTitle,
      totalCount,
      responses
    );

    if (threadWithResponsesResult.isErr()) {
      logger.error({
        operation: "getResponseByThreadIdAndResNum",
        threadId: threadId.val,
        responseNumber: responseNumber.val,
        error: threadWithResponsesResult.error,
        message: "Failed to create thread with responses object",
      });
      return err(threadWithResponsesResult.error);
    }

    logger.info({
      operation: "getResponseByThreadIdAndResNum",
      threadId: threadId.val,
      responseNumber: responseNumber.val,
      threadTitle: threadTitle.val,
      message:
        "Successfully fetched and processed specific response for thread",
    });

    return ok(threadWithResponsesResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "getResponseByThreadIdAndResNum",
      threadId: threadId.val,
      responseNumber: responseNumber.val,
      error,
      message: `Database error while fetching response: ${message}`,
    });
    return err(
      new DatabaseError(
        `レスポンス取得中にエラーが発生しました: ${message}`,
        error
      )
    );
  }
};
