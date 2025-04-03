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

import type { DbContext } from "../../types/DbContext";
import type { ValidationError } from "../../types/Error";
import type { WriteThreadId } from "../domain/write/WriteThreadId";

// スレッドIDを元に、最新のレスポンスを10個取得し、その内容を返す
export const getLatest10ThreadsWithResponsesRepository = async (
  { sql }: DbContext,
  { threadIds }: { threadIds: WriteThreadId[] }
): Promise<
  Result<ReadResponse[], DatabaseError | DataNotFoundError | ValidationError>
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
    const responses: ReadResponse[] = [];
    for (const response of result) {
      const combinedResult = Result.combine([
        createReadResponseId(response.id),
        createReadThreadId(response.thread_id),
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
        threadId,
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

      if (responseResult.isErr()) return err(responseResult.error);

      responses.push(responseResult.value);
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
