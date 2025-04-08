import { err, ok } from "neverthrow";

import { getDefaultAuthorNameRepository } from "../../config/repositories/getDefaultAuthorNameRepository";
import { getMaxContentLengthRepository } from "../../config/repositories/getMaxContentLengthRepository";
import { createWriteAuthorName } from "../domain/write/WriteAuthorName";
import { generateWriteHashId } from "../domain/write/WriteHashId";
import { createWriteMail, isSage } from "../domain/write/WriteMail";
import { generateCurrentPostedAt } from "../domain/write/WritePostedAt";
import { createWriteResponse } from "../domain/write/WriteResponse";
import { createWriteResponseContent } from "../domain/write/WriteResponseContent";
import { createWriteThreadId } from "../domain/write/WriteThreadId";
import { createResponseByThreadIdRepository } from "../repositories/createResponseByThreadIdRepository";
import { updateThreadUpdatedAtRepository } from "../repositories/updateThreadUpdatedAtRepository";

import type { VakContext } from "../../shared/types/VakContext";
import type { Result } from "neverthrow";

// レスを投稿する際のユースケース
export const postResponseByThreadIdUsecase = async (
  vakContext: VakContext,
  {
    threadIdRaw,
    authorNameRaw,
    mailRaw,
    responseContentRaw,
    ipAddressRaw,
  }: {
    threadIdRaw: string;
    authorNameRaw: string | null;
    mailRaw: string | null;
    responseContentRaw: string;
    ipAddressRaw: string;
  }
): Promise<Result<undefined, Error>> => {
  const { logger } = vakContext;

  logger.info({
    operation: "postResponseByThreadId",
    threadId: threadIdRaw,
    message: "Starting response creation process",
  });

  // ThreadIdを生成
  logger.debug({
    operation: "postResponseByThreadId",
    threadId: threadIdRaw,
    message: "Validating thread ID",
  });

  const threadIdResult = createWriteThreadId(threadIdRaw);
  if (threadIdResult.isErr()) {
    logger.error({
      operation: "postResponseByThreadId",
      error: threadIdResult.error,
      threadId: threadIdRaw,
      message: "Invalid thread ID format",
    });
    return err(threadIdResult.error);
  }

  // ユーザ名を生成
  logger.debug({
    operation: "postResponseByThreadId",
    authorName: authorNameRaw,
    message: "Processing author name",
  });

  const authorNameResult = await createWriteAuthorName(
    authorNameRaw,
    async () => {
      logger.debug({
        operation: "postResponseByThreadId",
        message: "Fetching default author name from config",
      });

      const nanashiNameResult = await getDefaultAuthorNameRepository(
        vakContext
      );
      if (nanashiNameResult.isErr()) {
        logger.error({
          operation: "postResponseByThreadId",
          error: nanashiNameResult.error,
          message: "Failed to fetch default author name",
        });
        return err(nanashiNameResult.error);
      }
      return ok(nanashiNameResult.value.val);
    }
  );
  if (authorNameResult.isErr()) {
    logger.error({
      operation: "postResponseByThreadId",
      error: authorNameResult.error,
      authorName: authorNameRaw,
      message: "Invalid author name format",
    });
    return err(authorNameResult.error);
  }

  // メール生成
  logger.debug({
    operation: "postResponseByThreadId",
    mail: mailRaw,
    message: "Validating mail address",
  });

  const mailResult = createWriteMail(mailRaw);
  if (mailResult.isErr()) {
    logger.error({
      operation: "postResponseByThreadId",
      error: mailResult.error,
      mail: mailRaw,
      message: "Invalid mail format",
    });
    return err(mailResult.error);
  }

  // レス内容生成
  logger.debug({
    operation: "postResponseByThreadId",
    contentLength: responseContentRaw.length,
    message: "Validating response content",
  });

  const responseContentResult = await createWriteResponseContent(
    responseContentRaw,
    async () => {
      logger.debug({
        operation: "postResponseByThreadId",
        message: "Fetching max content length from config",
      });

      const result = await getMaxContentLengthRepository(vakContext);
      if (result.isErr()) {
        logger.error({
          operation: "postResponseByThreadId",
          error: result.error,
          message: "Failed to fetch max content length",
        });
        return err(result.error);
      }
      return ok(result.value.val);
    }
  );
  if (responseContentResult.isErr()) {
    logger.error({
      operation: "postResponseByThreadId",
      error: responseContentResult.error,
      contentLength: responseContentRaw.length,
      message: "Invalid response content",
    });
    return err(responseContentResult.error);
  }

  // 現在時刻を生成
  const postedAt = generateCurrentPostedAt();

  // ハッシュ値作成
  logger.debug({
    operation: "postResponseByThreadId",
    message: "Generating hash ID",
  });

  const hashId = generateWriteHashId(ipAddressRaw, postedAt.val);
  if (hashId.isErr()) {
    logger.error({
      operation: "postResponseByThreadId",
      error: hashId.error,
      message: "Failed to generate hash ID",
    });
    return err(hashId.error);
  }

  // レスを作成
  logger.debug({
    operation: "postResponseByThreadId",
    message: "Creating response object",
  });

  const response = await createWriteResponse({
    getThreadId: async () => {
      return ok(threadIdResult.value.val);
    },
    authorName: authorNameResult.value,
    mail: mailResult.value,
    responseContent: responseContentResult.value,
    hashId: hashId.value,
    postedAt,
  });
  if (response.isErr()) {
    logger.error({
      operation: "postResponseByThreadId",
      error: response.error,
      message: "Failed to create response object",
    });
    return err(response.error);
  }

  // 最後に永続化
  logger.debug({
    operation: "postResponseByThreadId",
    threadId: threadIdRaw,
    message: "Persisting response to database",
  });

  const responseResult = await createResponseByThreadIdRepository(
    vakContext,
    response.value
  );
  if (responseResult.isErr()) {
    logger.error({
      operation: "postResponseByThreadId",
      error: responseResult.error,
      threadId: threadIdRaw,
      message: "Failed to persist response to database",
    });
    return err(responseResult.error);
  }

  // また、スレッドのupdated_atも更新する必要がある
  // メールが'sage'でない場合のみ
  if (!isSage(mailResult.value)) {
    logger.debug({
      operation: "postResponseByThreadId",
      threadId: threadIdRaw,
      message: "Updating thread updated_at timestamp",
    });

    const threadResult = await updateThreadUpdatedAtRepository(vakContext, {
      threadId: threadIdResult.value,
      updatedAt: postedAt,
    });
    if (threadResult.isErr()) {
      logger.error({
        operation: "postResponseByThreadId",
        error: threadResult.error,
        threadId: threadIdRaw,
        message: "Failed to update thread timestamp",
      });
      return err(threadResult.error);
    }

    logger.debug({
      operation: "postResponseByThreadId",
      threadId: threadIdRaw,
      message: "Successfully updated thread timestamp",
    });
  }

  logger.info({
    operation: "postResponseByThreadId",
    threadId: threadIdRaw,
    responseId: response.value.id.val,
    message: "Successfully created response",
  });

  return ok(undefined);
};
