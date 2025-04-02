import { err, ok } from "neverthrow";

import { generateHashId } from "../../domain/value_object/HashId";
import { createMail } from "../../domain/value_object/Mail";
import { generateCurrentPostedAt } from "../../domain/value_object/PostedAt";
import { createThreadId } from "../../domain/value_object/ThreadId";
import { createWriteAuthorName } from "../../domain/value_object/WriteAuthorName";
import { createWriteResponseContent } from "../../domain/value_object/WriteResponseContent";
import { createResponse } from "../../domain/write_model/Response";
import { createResponseRepository } from "../../repositories/createResponseRepository";
import { getMaxLenContentConfigRepository } from "../../repositories/getMaxLenContentConfigRepository";
import { getNanashiConfigRepository } from "../../repositories/getNanashiConfigRepository";
import { updateThreadUpdatedAtRepository } from "../../repositories/updateThreadUpdatedAtRepository";

import type { DbContext } from "../../types/DbContext";

// レスを投稿する際のユースケース
export const postResponseByThreadIdUsecase = async (
  dbContext: DbContext,
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
) => {
  // ThreadEpochIdを生成
  const threadIdResult = createThreadId(threadIdRaw);
  if (threadIdResult.isErr()) {
    return err(threadIdResult.error);
  }
  // ユーザ名を生成
  const authorNameResult = await createWriteAuthorName(
    authorNameRaw,
    async () => {
      const nanashiNameResult = getNanashiConfigRepository(dbContext);
      return nanashiNameResult;
    }
  );
  if (authorNameResult.isErr()) {
    return err(authorNameResult.error);
  }
  // メール生成
  const mailResult = createMail(mailRaw);
  if (mailResult.isErr()) {
    return err(mailResult.error);
  }
  // レス内容生成
  const responseContentResult = await createWriteResponseContent(
    responseContentRaw,
    async () => {
      const result = await getMaxLenContentConfigRepository(dbContext);
      return result;
    }
  );
  if (responseContentResult.isErr()) {
    return err(responseContentResult.error);
  }
  // 現在時刻を生成
  const postedAt = generateCurrentPostedAt()._unsafeUnwrap(); // ここでエラーが出ることはない

  // ハッシュ値作成
  const hashId = generateHashId(ipAddressRaw, postedAt.val);
  if (hashId.isErr()) {
    return err(hashId.error);
  }

  // レスを作成
  const response = createResponse({
    threadId: threadIdResult.value,
    authorName: authorNameResult.value,
    mail: mailResult.value,
    responseContent: responseContentResult.value,
    hashId: hashId.value,
    postedAt,
  });
  if (response.isErr()) {
    return err(response.error);
  }

  // 最後に永続化
  const responseResult = await createResponseRepository(
    dbContext,
    response.value
  );
  if (responseResult.isErr()) {
    return err(responseResult.error);
  }

  // また、スレッドのupdated_atも更新する必要がある
  const threadResult = await updateThreadUpdatedAtRepository(dbContext, {
    threadId: threadIdResult.value,
    updatedAt: postedAt,
  });
  if (threadResult.isErr()) {
    return err(threadResult.error);
  }

  return ok(threadResult.value);
};
