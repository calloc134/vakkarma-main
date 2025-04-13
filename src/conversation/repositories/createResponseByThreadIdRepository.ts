import { ok, err } from "neverthrow";

import { DatabaseError } from "../../shared/types/Error";
import { createReadResponseNumber } from "../domain/read/ReadResponseNumber";
import { createReadThreadId } from "../domain/read/ReadThreadId";

import type { VakContext } from "../../shared/types/VakContext";
import type { ReadResponseNumber } from "../domain/read/ReadResponseNumber";
import type { ReadThreadId } from "../domain/read/ReadThreadId";
import type { WriteResponse } from "../domain/write/WriteResponse";
import type { Result } from "neverthrow";

// レスポンスを作成するリポジトリ
export const createResponseByThreadIdRepository = async (
  { sql, logger }: VakContext,
  response: WriteResponse
): Promise<
  Result<
    {
      threadId: ReadThreadId;
      responseNumber: ReadResponseNumber;
    },
    DatabaseError
  >
> => {
  const trip =
    response.authorName.val._type === "some"
      ? response.authorName.val.trip
      : null;

  logger.debug({
    operation: "createResponseByThreadId",
    responseId: response.id.val,
    threadId: response.threadId.val,
    message: "Creating new response in database",
  });

  try {
    const result = await sql<
      { id: string; response_number: number; thread_id: string }[]
    >`
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
        ) RETURNING id, response_number, thread_id
      `;

    if (!result || result.length !== 1) {
      logger.error({
        operation: "createResponseByThreadId",
        responseId: response.id.val,
        threadId: response.threadId.val,
        message: "Failed to create response, invalid database response",
      });
      return err(new DatabaseError("レスポンスの作成に失敗しました"));
    }

    logger.info({
      operation: "createResponseByThreadId",
      responseId: response.id.val,
      threadId: response.threadId.val,
      message: "Response created successfully",
    });

    const threadIdResult = createReadThreadId(result[0].thread_id);
    if (threadIdResult.isErr()) {
      logger.error({
        operation: "createResponseByThreadId",
        error: threadIdResult.error,
        responseId: response.id.val,
        threadId: response.threadId.val,
        message: "Failed to create thread ID from database result",
      });
      return err(threadIdResult.error);
    }
    const responseNumber = createReadResponseNumber(result[0].response_number);

    if (responseNumber.isErr()) {
      logger.error({
        operation: "createResponseByThreadId",
        error: responseNumber.error,
        responseId: response.id.val,
        threadId: response.threadId.val,
        message: "Failed to create response number from database result",
      });
      return err(responseNumber.error);
    }

    return ok({
      threadId: threadIdResult.value,
      responseNumber: responseNumber.value,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({
      operation: "createResponseByThreadId",
      responseId: response.id.val,
      threadId: response.threadId.val,
      error,
      message: `Database error while creating response: ${message}`,
    });
    return err(
      new DatabaseError(
        `レスポンス作成中にエラーが発生しました: ${message}`,
        error
      )
    );
  }
};
