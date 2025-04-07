import { err, ok } from "neverthrow";

import { getDefaultAuthorNameRepository } from "../../config/repositories/getDefaultAuthorNameRepository";
import { getMaxContentLengthRepository } from "../../config/repositories/getMaxContentLengthRepository";
import { createWriteAuthorName } from "../domain/write/WriteAuthorName";
import { generateWriteHashId } from "../domain/write/WriteHashId";
import { createWriteMail } from "../domain/write/WriteMail";
import { generateCurrentPostedAt } from "../domain/write/WritePostedAt";
import { createWriteResponse } from "../domain/write/WriteResponse";
import { createWriteResponseContent } from "../domain/write/WriteResponseContent";
import { createWriteThreadEpochId } from "../domain/write/WriteThreadEpochId";
import { createWriteThreadId } from "../domain/write/WriteThreadId";
import { createResponseByThreadIdRepository } from "../repositories/createResponseByThreadIdRepository";
import { getThreadIdByThreadEpochIdRepository } from "../repositories/getThreadIdByThreadEpochIdRepository";
import { updateThreadUpdatedAtRepository } from "../repositories/updateThreadUpdatedAtRepository";

import type { VakContext } from "../../types/VakContext";

// レスを投稿する際のユースケース
export const postResponseByThreadEpochIdUsecase = async (
  vakContext: VakContext,
  {
    threadEpochIdRaw,
    authorNameRaw,
    mailRaw,
    responseContentRaw,
    ipAddressRaw,
  }: {
    threadEpochIdRaw: string;
    authorNameRaw: string | null;
    mailRaw: string | null;
    responseContentRaw: string;
    ipAddressRaw: string;
  }
) => {
  const { logger } = vakContext;
  
  logger.info({
    operation: "postResponseByThreadEpochId",
    threadEpochId: threadEpochIdRaw,
    hasAuthorName: authorNameRaw !== null,
    hasMail: mailRaw !== null,
    contentLength: responseContentRaw.length,
    message: "Starting response creation by thread epoch ID"
  });
  
  // ThreadEpochIdを生成
  logger.debug({
    operation: "postResponseByThreadEpochId",
    threadEpochId: threadEpochIdRaw,
    message: "Validating thread epoch ID"
  });
  
  const threadEpochIdResult = createWriteThreadEpochId(threadEpochIdRaw);
  if (threadEpochIdResult.isErr()) {
    logger.error({
      operation: "postResponseByThreadEpochId",
      error: threadEpochIdResult.error,
      threadEpochId: threadEpochIdRaw,
      message: "Invalid thread epoch ID format"
    });
    return err(threadEpochIdResult.error);
  }

  // ThreadIdを取得 read
  logger.debug({
    operation: "postResponseByThreadEpochId",
    threadEpochId: threadEpochIdRaw,
    message: "Fetching thread ID from epoch ID"
  });
  
  const readThreadIdResult = await getThreadIdByThreadEpochIdRepository(
    vakContext,
    {
      threadEpochId: threadEpochIdResult.value,
    }
  );
  if (readThreadIdResult.isErr()) {
    logger.error({
      operation: "postResponseByThreadEpochId",
      error: readThreadIdResult.error,
      threadEpochId: threadEpochIdRaw,
      message: "Failed to retrieve thread ID from epoch ID"
    });
    return err(readThreadIdResult.error);
  }

  // writeにする
  logger.debug({
    operation: "postResponseByThreadEpochId",
    threadId: readThreadIdResult.value.val,
    message: "Converting thread ID to write format"
  });
  
  const writeThreadIdResult = createWriteThreadId(readThreadIdResult.value.val);
  if (writeThreadIdResult.isErr()) {
    logger.error({
      operation: "postResponseByThreadEpochId",
      error: writeThreadIdResult.error,
      threadId: readThreadIdResult.value.val,
      message: "Failed to convert thread ID to write format"
    });
    return err(writeThreadIdResult.error);
  }

  // ユーザ名を生成
  logger.debug({
    operation: "postResponseByThreadEpochId",
    threadEpochId: threadEpochIdRaw,
    hasAuthorName: authorNameRaw !== null,
    message: "Creating author name"
  });
  
  const authorNameResult = await createWriteAuthorName(
    authorNameRaw,
    async () => {
      const nanashiNameResult = await getDefaultAuthorNameRepository(vakContext);
      if (nanashiNameResult.isErr()) {
        return err(nanashiNameResult.error);
      }
      return ok(nanashiNameResult.value.val);
    }
  );
  if (authorNameResult.isErr()) {
    logger.error({
      operation: "postResponseByThreadEpochId",
      error: authorNameResult.error,
      threadEpochId: threadEpochIdRaw,
      authorName: authorNameRaw,
      message: "Failed to create author name"
    });
    return err(authorNameResult.error);
  }
  
  // メール生成
  logger.debug({
    operation: "postResponseByThreadEpochId",
    hasMail: mailRaw !== null,
    message: "Creating mail"
  });
  
  const mailResult = createWriteMail(mailRaw);
  if (mailResult.isErr()) {
    logger.error({
      operation: "postResponseByThreadEpochId",
      error: mailResult.error,
      mail: mailRaw,
      message: "Failed to create mail"
    });
    return err(mailResult.error);
  }
  
  // レス内容生成
  logger.debug({
    operation: "postResponseByThreadEpochId",
    contentLength: responseContentRaw.length,
    message: "Creating response content"
  });
  
  const responseContentResult = await createWriteResponseContent(
    responseContentRaw,
    async () => {
      const result = await getMaxContentLengthRepository(vakContext);
      if (result.isErr()) {
        return err(result.error);
      }
      return ok(result.value.val);
    }
  );
  if (responseContentResult.isErr()) {
    logger.error({
      operation: "postResponseByThreadEpochId",
      error: responseContentResult.error,
      contentLength: responseContentRaw.length,
      message: "Failed to create response content"
    });
    return err(responseContentResult.error);
  }
  
  // 現在時刻を生成
  logger.debug({
    operation: "postResponseByThreadEpochId",
    message: "Generating current timestamp"
  });
  
  const postedAt = generateCurrentPostedAt();

  // ハッシュ値作成
  logger.debug({
    operation: "postResponseByThreadEpochId",
    message: "Generating hash ID"
  });
  
  const hashId = generateWriteHashId(ipAddressRaw, postedAt.val);
  if (hashId.isErr()) {
    logger.error({
      operation: "postResponseByThreadEpochId",
      error: hashId.error,
      message: "Failed to generate hash ID"
    });
    return err(hashId.error);
  }

  // レスを作成
  logger.debug({
    operation: "postResponseByThreadEpochId",
    threadId: writeThreadIdResult.value.val,
    message: "Creating response object"
  });
  
  const response = await createWriteResponse({
    // 高階関数パターン必要なかったかも
    getThreadId: async () => {
      return ok(writeThreadIdResult.value.val);
    },
    authorName: authorNameResult.value,
    mail: mailResult.value,
    responseContent: responseContentResult.value,
    hashId: hashId.value,
    postedAt,
  });
  if (response.isErr()) {
    logger.error({
      operation: "postResponseByThreadEpochId",
      error: response.error,
      threadId: writeThreadIdResult.value.val,
      message: "Failed to create response object"
    });
    return err(response.error);
  }

  // 最後に永続化
  logger.debug({
    operation: "postResponseByThreadEpochId",
    threadId: writeThreadIdResult.value.val,
    message: "Persisting response to database"
  });
  
  const responseResult = await createResponseByThreadIdRepository(
    vakContext,
    response.value
  );
  if (responseResult.isErr()) {
    logger.error({
      operation: "postResponseByThreadEpochId",
      error: responseResult.error,
      threadId: writeThreadIdResult.value.val,
      message: "Failed to persist response to database"
    });
    return err(responseResult.error);
  }

  // また、スレッドのupdated_atも更新する必要がある
  logger.debug({
    operation: "postResponseByThreadEpochId",
    threadId: writeThreadIdResult.value.val,
    message: "Updating thread timestamp"
  });
  
  const threadResult = await updateThreadUpdatedAtRepository(vakContext, {
    threadId: writeThreadIdResult.value,
    updatedAt: postedAt,
  });
  if (threadResult.isErr()) {
    logger.error({
      operation: "postResponseByThreadEpochId",
      error: threadResult.error,
      threadId: writeThreadIdResult.value.val,
      message: "Failed to update thread timestamp"
    });
    return err(threadResult.error);
  }

  logger.info({
    operation: "postResponseByThreadEpochId",
    threadId: writeThreadIdResult.value.val,
    threadEpochId: threadEpochIdRaw,
    postedAt: postedAt.val,
    message: "Successfully created response and updated thread"
  });
  
  return ok(threadResult.value);
};
