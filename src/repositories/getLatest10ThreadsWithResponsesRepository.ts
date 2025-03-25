import { ok, err } from "neverthrow";

import { createHashId } from "../domain/value_object/HashId";
import { createMail } from "../domain/value_object/Mail";
import { createPostedAt } from "../domain/value_object/PostedAt";
import { createReadAuthorName } from "../domain/value_object/ReadAuthorName";
import { createReadResponseContent } from "../domain/value_object/ReadResponseContent";
import { createResponseId } from "../domain/value_object/ResponseId";
import { createResponseNumber } from "../domain/value_object/ResponseNumber";
import { type ThreadId, createThreadId } from "../domain/value_object/ThreadId";
import { DatabaseError, DataNotFoundError } from "../types/Error";

import type { ResponseForRead } from "../domain/read_model/ResponseForRead";
import type { DbContext } from "../types/DbContext";
import type { ValidationError } from "../types/Error";
import type { Result } from "neverthrow";

// スレッドIDを元に、最新のレスポンスを10個取得し、その内容を返す
export const getLatest10ThreadsWithResponsesRepository = async (
  { sql }: DbContext,
  { threadIds }: { threadIds: ThreadId[] }
): Promise<
  Result<ResponseForRead[], DatabaseError | DataNotFoundError | ValidationError>
> => {
  // そのままでは扱えないのでstringを取り出し
  const threadIdRaw = threadIds.map((id) => id.val);
  try {
    // 複雑なクエリ内容なので、流石にsafeqlの補完が効かないと思ったら、効いた・・・？
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
      }[]
    >`
        WITH thread_max_response AS(
            -- 各スレッドの最大レスポンス番号を計算（連番なので実質レスポンス数と同じ）
            SELECT
                thread_id,
                MAX(response_number) AS max_response_number
            FROM
                responses
            WHERE
                thread_id = ANY(
                    ${threadIdRaw}::uuid[]
                )
            GROUP BY
                thread_id
        ),
        latest_responses AS(
            -- 各スレッドの最新10件のレスポンスを取得（max_response_numberが12以上の場合）
            SELECT
                r.*
            FROM
                responses r
                JOIN
                    thread_max_response tmr
                ON  r.thread_id = tmr.thread_id
            WHERE
                tmr.max_response_number >= 12
            AND r.response_number > (tmr.max_response_number - 10)
        ),
        first_responses AS(
            -- 各スレッドの最初のレスポンスを取得（max_response_numberが12以上の場合）
            SELECT
                r.*
            FROM
                responses r
                JOIN
                    thread_max_response tmr
                ON  r.thread_id = tmr.thread_id
            WHERE
                tmr.max_response_number >= 12
            AND r.response_number = 1
        ),
        small_threads_responses AS(
            -- 11件以下のスレッドのすべてのレスポンスを取得
            SELECT
                r.*
            FROM
                responses r
                JOIN
                    thread_max_response tmr
                ON  r.thread_id = tmr.thread_id
            WHERE
                tmr.max_response_number <= 11
        )
        -- 結果を結合
        SELECT
            *
        FROM
            (
                SELECT
                    *
                FROM
                    latest_responses
                UNION ALL
                SELECT
                    *
                FROM
                    first_responses
                UNION ALL
                SELECT
                    *
                FROM
                    small_threads_responses
            ) AS combined_results
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
    }[];

    if (!result || result.length === 0) {
      return err(new DataNotFoundError("レスポンスの取得に失敗しました"));
    }

    // 詰め替え部分
    const responses: ResponseForRead[] = [];
    for (const response of result) {
      const idResult = createResponseId(response.id);
      if (idResult.isErr()) return err(idResult.error);

      const threadIdResult = createThreadId(response.thread_id);
      if (threadIdResult.isErr()) return err(threadIdResult.error);

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

      const responseContentResult = createReadResponseContent(
        response.response_content
      );
      if (responseContentResult.isErr())
        return err(responseContentResult.error);

      const hashIdResult = createHashId(response.hash_id);
      if (hashIdResult.isErr()) return err(hashIdResult.error);

      responses.push({
        _type: "ResponseForRead",
        responseId: idResult.value,
        threadId: threadIdResult.value,
        responseNumber: responseNumberResult.value,
        authorName: authorNameResult.value,
        mail: mailResult.value,
        postedAt: postedAtResult.value,
        responseContent: responseContentResult.value,
        hashId: hashIdResult.value,
      });
    }

    return ok(responses);
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
