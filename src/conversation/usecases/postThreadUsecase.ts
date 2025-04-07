import { err, ok } from "neverthrow";

import { getDefaultAuthorNameRepository } from "../../config/repositories/getDefaultAuthorNameRepository";
import { getMaxContentLengthRepository } from "../../config/repositories/getMaxContentLengthRepository";
import { createWriteAuthorName } from "../domain/write/WriteAuthorName";
import { generateWriteHashId } from "../domain/write/WriteHashId";
import { createWriteMail } from "../domain/write/WriteMail";
import { generateCurrentPostedAt } from "../domain/write/WritePostedAt";
import { createWriteResponse } from "../domain/write/WriteResponse";
import { createWriteResponseContent } from "../domain/write/WriteResponseContent";
import { createWriteThread } from "../domain/write/WriteThread";
import { createWriteThreadTitle } from "../domain/write/WriteThreadTitle";
import { createResponseByThreadIdRepository } from "../repositories/createResponseByThreadIdRepository";
import { createThreadRepository } from "../repositories/createThreadRepository";

import type { VakContext } from "../../shared/types/VakContext";

// スレッドを投稿する際のユースケース
export const postThreadUsecase = async (
  vakContext: VakContext,
  {
    // レスポンス番号は必ず1になるので必要ない
    threadTitleRaw,
    authorNameRaw,
    mailRaw,
    responseContentRaw,
    ipAddressRaw,
  }: {
    threadTitleRaw: string;
    authorNameRaw: string | null;
    mailRaw: string | null;
    responseContentRaw: string;
    ipAddressRaw: string;
  }
) => {
  const { logger } = vakContext;

  logger.info({
    operation: "postThread",
    threadTitle: threadTitleRaw,
    message: "Starting thread creation process",
  });

  // スレタイを生成
  logger.debug({
    operation: "postThread",
    threadTitle: threadTitleRaw,
    message: "Validating thread title",
  });

  const threadTitleResult = createWriteThreadTitle(threadTitleRaw);
  if (threadTitleResult.isErr()) {
    logger.error({
      operation: "postThread",
      error: threadTitleResult.error,
      threadTitle: threadTitleRaw,
      message: "Invalid thread title format",
    });
    return err(threadTitleResult.error);
  }

  // ユーザ名を生成
  logger.debug({
    operation: "postThread",
    authorName: authorNameRaw,
    message: "Processing author name",
  });

  const authorNameResult = await createWriteAuthorName(
    authorNameRaw,
    async () => {
      logger.debug({
        operation: "postThread",
        message: "Fetching default author name from config",
      });

      const nanashiNameResult = await getDefaultAuthorNameRepository(
        vakContext
      );
      if (nanashiNameResult.isErr()) {
        logger.error({
          operation: "postThread",
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
      operation: "postThread",
      error: authorNameResult.error,
      authorName: authorNameRaw,
      message: "Invalid author name format",
    });
    return err(authorNameResult.error);
  }

  // メール生成
  logger.debug({
    operation: "postThread",
    mail: mailRaw,
    message: "Validating mail address",
  });

  const mailResult = createWriteMail(mailRaw);
  if (mailResult.isErr()) {
    logger.error({
      operation: "postThread",
      error: mailResult.error,
      mail: mailRaw,
      message: "Invalid mail format",
    });
    return err(mailResult.error);
  }

  // レス内容生成
  logger.debug({
    operation: "postThread",
    contentLength: responseContentRaw.length,
    message: "Validating response content",
  });

  const responseContentResult = await createWriteResponseContent(
    responseContentRaw,
    async () => {
      logger.debug({
        operation: "postThread",
        message: "Fetching max content length from config",
      });

      const result = await getMaxContentLengthRepository(vakContext);
      if (result.isErr()) {
        logger.error({
          operation: "postThread",
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
      operation: "postThread",
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
    operation: "postThread",
    message: "Generating hash ID",
  });

  const hashId = generateWriteHashId(ipAddressRaw, postedAt.val);
  if (hashId.isErr()) {
    logger.error({
      operation: "postThread",
      error: hashId.error,
      message: "Failed to generate hash ID",
    });
    return err(hashId.error);
  }

  // まずスレッド作成
  logger.debug({
    operation: "postThread",
    threadTitle: threadTitleRaw,
    message: "Creating thread object",
  });

  const thread = createWriteThread({
    title: threadTitleResult.value,
    postedAt,
  });
  if (thread.isErr()) {
    logger.error({
      operation: "postThread",
      error: thread.error,
      threadTitle: threadTitleRaw,
      message: "Failed to create thread object",
    });
    return err(thread.error);
  }

  // 一番目のレスも作成
  logger.debug({
    operation: "postThread",
    threadId: thread.value.id.val,
    message: "Creating first response object for thread",
  });

  const response = await createWriteResponse({
    getThreadId: async () => {
      return ok(thread.value.id.val);
    },
    authorName: authorNameResult.value,
    mail: mailResult.value,
    responseContent: responseContentResult.value,
    hashId: hashId.value,
    postedAt,
  });
  if (response.isErr()) {
    logger.error({
      operation: "postThread",
      error: response.error,
      threadId: thread.value.id.val,
      message: "Failed to create response object",
    });
    return err(response.error);
  }

  // 最後に永続化
  // 先にレスを作成したほうが安全側に倒せそう
  logger.debug({
    operation: "postThread",
    threadId: thread.value.id.val,
    message: "Persisting response to database",
  });

  const responseResult = await createResponseByThreadIdRepository(
    vakContext,
    response.value
  );
  if (responseResult.isErr()) {
    logger.error({
      operation: "postThread",
      error: responseResult.error,
      threadId: thread.value.id.val,
      message: "Failed to persist response to database",
    });
    return err(responseResult.error);
  }

  logger.debug({
    operation: "postThread",
    threadId: thread.value.id.val,
    threadTitle: threadTitleRaw,
    message: "Persisting thread to database",
  });

  const threadResult = await createThreadRepository(vakContext, thread.value);
  if (threadResult.isErr()) {
    logger.error({
      operation: "postThread",
      error: threadResult.error,
      threadId: thread.value.id.val,
      message: "Failed to persist thread to database",
    });
    return err(threadResult.error);
  }

  logger.info({
    operation: "postThread",
    threadId: thread.value.id.val,
    threadTitle: threadTitleRaw,
    responseId: response.value.id.val,
    message: "Successfully created thread with first response",
  });

  return ok(threadResult.value);
};
