import { ok, err } from "neverthrow";

import { createHashId } from "../domain/value_object/HashId";
import { createMail } from "../domain/value_object/Mail";
import { createPostedAt } from "../domain/value_object/PostedAt";
import { createReadAuthorName } from "../domain/value_object/ReadAuthorName";
import { createResponseContent } from "../domain/value_object/ResponseContent";
import { createResponseId } from "../domain/value_object/ResponseId";
import { createResponseNumber } from "../domain/value_object/ResponseNumber";
import { createThreadTitle } from "../domain/value_object/ThreadTitle";
import { DatabaseError, DataNotFoundError } from "../types/Error";

import type { ResponseForRead } from "../domain/read_model/ResponseForRead";
import type { ThreadId } from "../domain/value_object/ThreadId";
import type { ThreadTitle } from "../domain/value_object/ThreadTitle";
import type { DbContext } from "../types/DbContext";
import type { ValidationError } from "../types/Error";
import type { Result } from "neverthrow";

// 指定されたスレッドのすべてのレスポンスを取得するだけのリポジトリ
// 便宜上、スレッドタイトルも取得する
export const getAllResponsesByThreadIdRepository = async (
  { sql }: DbContext,
  { threadId }: { threadId: ThreadId }
): Promise<
  Result<
    {
      thread: { threadId: ThreadId; threadTitle: ThreadTitle };
      responses: ResponseForRead[];
    },
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
              r.thread_id = ${threadId.val}::uuid
          ORDER BY
              r.response_number
      `;

    if (!result || result.length === 0) {
      return err(new DataNotFoundError("レスポンスの取得に失敗しました"));
    }

    // 詰め替え部分
    const responses: ResponseForRead[] = [];
    for (const response of result) {
      const idResult = createResponseId(response.id);
      if (idResult.isErr()) return err(idResult.error);

      const responseNumberResult = createResponseNumber(
        response.response_number
      );
      if (responseNumberResult.isErr()) return err(responseNumberResult.error);

      const authorNameResult = createReadAuthorName(
        response.author_name,
        response.trip
      );
      if (authorNameResult.isErr()) return err(authorNameResult.error);

      const mailResult = createMail(response.mail);
      if (mailResult.isErr()) return err(mailResult.error);

      const postedAtResult = createPostedAt(response.posted_at);
      if (postedAtResult.isErr()) return err(postedAtResult.error);

      const responseContentResult = createResponseContent(
        response.response_content
      );
      if (responseContentResult.isErr())
        return err(responseContentResult.error);

      const hashIdResult = createHashId(response.hash_id);
      if (hashIdResult.isErr()) return err(hashIdResult.error);

      responses.push({
        _type: "ResponseForRead",
        threadId: threadId,
        responseId: idResult.value,
        responseNumber: responseNumberResult.value,
        authorName: authorNameResult.value,
        mail: mailResult.value,
        postedAt: postedAtResult.value,
        responseContent: responseContentResult.value,
        hashId: hashIdResult.value,
      });
    }

    // スレッドタイトルの取得とバリデーション
    const firstResponse = result[0];
    const threadTitleResult = createThreadTitle(firstResponse.title);
    if (threadTitleResult.isErr()) {
      return err(threadTitleResult.error);
    }

    return ok({
      thread: {
        threadId: threadId,
        threadTitle: threadTitleResult.value,
      },
      responses,
    });
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
