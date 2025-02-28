import { ok, err } from "neverthrow";

import { DatabaseError } from "../types/Error";

import type { Response } from "../domain/write_model/Response";
import type { DbContext } from "../types/DbContext";
import type { Result } from "neverthrow";

// レスポンスを作成するリポジトリ
export const createResponseByThreadEpochIdRepository = async (
  { sql }: DbContext,
  response: Response
): Promise<Result<undefined, DatabaseError>> => {
  const trip =
    response.authorName.val._type === "some"
      ? response.authorName.val.trip
      : null;

  try {
    const result = await sql<{ id: string }[]>`
        INSERT INTO responses(
            id,
            thread_id,
            response_number,
            author_name,
            mail,
            posted_at,
            response_content,
            hash_id,
            trip
        )
        VALUES(
            ${response.id.val}::uuid,
            ${response.threadId.val}::uuid,
            -- レスポンス番号はスレッド内での最大値 + 1
            (
                SELECT COALESCE(MAX(response_number), 0) + 1
                FROM responses
                WHERE thread_id = ${response.threadId.val}::uuid
            ),
            ${response.authorName.val.authorName},
            ${response.mail.val},
            ${response.postedAt.val},
            ${response.responseContent.val},
            ${response.hashId.val},
            ${trip}
        ) RETURNING id
      `;

    if (!result || result.length !== 1) {
      return err(new DatabaseError("レスポンスの作成に失敗しました"));
    }
    return ok(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new DatabaseError(
        `レスポンス作成中にエラーが発生しました: ${message}`,
        error
      )
    );
  }
};
