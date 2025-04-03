import { ok, err } from "neverthrow";
import { Result } from "neverthrow";

import { DatabaseError, DataNotFoundError } from "../../types/Error";
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

import type { DbContext } from "../../types/DbContext";
import type { ValidationError } from "../../types/Error";
import type { WriteThreadEpochId } from "../domain/write/WriteThreadEpochId";

// 指定されたスレッドのすべてのレスポンスを取得するだけのリポジトリ
// 便宜上、スレッドタイトルも取得する
export const getAllResponsesByThreadEpochIdRepository = async (
  { sql }: DbContext,
  { threadEpochId }: { threadEpochId: WriteThreadEpochId }
): Promise<
  Result<
    ReadThreadWithResponses,
    DatabaseError | DataNotFoundError | ValidationError
  >
> => {
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
      }[]
    >`
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
              t.title
          FROM
              responses as r
              JOIN
                  threads as t
              ON  r.thread_id = t.id
          WHERE
            t.epoch_id = ${threadEpochId.val}
          ORDER BY
              r.response_number
      `;

    if (!result || result.length === 0) {
      return err(new DataNotFoundError("レスポンスの取得に失敗しました"));
    }

    // 詰め替え部分
    const threadIdResult = createReadThreadId(result[0].thread_id);
    if (threadIdResult.isErr()) {
      return err(threadIdResult.error);
    }

    const threadId = threadIdResult.value;
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
        threadId,
        responseNumber,
        authorName,
        mail,
        postedAt,
        responseContent,
        hashId,
      });

      if (responseResult.isErr()) {
        return err(responseResult.error);
      }

      responses.push(responseResult.value);
    }

    // スレッドタイトルの取得とバリデーション
    const firstResponse = result[0];
    const threadTitleResult = createReadThreadTitle(firstResponse.title);
    if (threadTitleResult.isErr()) {
      return err(threadTitleResult.error);
    }

    const threadWithResponsesResult = createReadThreadWithResponses(
      threadId,
      threadTitleResult.value,
      responses
    );

    if (threadWithResponsesResult.isErr()) {
      return err(threadWithResponsesResult.error);
    }

    return ok(threadWithResponsesResult.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(
        `レスポンス取得中にエラーが発生しました: ${message}`,
        error
      )
    );
  }
};
