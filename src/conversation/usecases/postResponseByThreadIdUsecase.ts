import { err, ok } from "neverthrow";

import { getDefaultAuthorNameRepository } from "../../config/repositories/getDefaultAuthorNameRepository";
import { getMaxContentLengthRepository } from "../../config/repositories/getMaxContentLengthRepository";
import { createWriteAuthorName } from "../domain/write/WriteAuthorName";
import { generateWriteHashId } from "../domain/write/WriteHashId";
import { createWriteMail } from "../domain/write/WriteMail";
import { generateCurrentPostedAt } from "../domain/write/WritePostedAt";
import { createWriteResponse } from "../domain/write/WriteResponse";
import { createWriteResponseContent } from "../domain/write/WriteResponseContent";
import { createWriteThreadId } from "../domain/write/WriteThreadId";
import { createResponseByThreadIdRepository } from "../repositories/createResponseByThreadIdRepository";
import { updateThreadUpdatedAtRepository } from "../repositories/updateThreadUpdatedAtRepository";

import type { VakContext } from "../../types/VakContext";

// レスを投稿する際のユースケース
export const postResponseByThreadIdUsecase = async (
  dbContext: VakContext,
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
  // ThreadIdを生成
  const threadIdResult = createWriteThreadId(threadIdRaw);
  if (threadIdResult.isErr()) {
    return err(threadIdResult.error);
  }
  // ユーザ名を生成
  const authorNameResult = await createWriteAuthorName(
    authorNameRaw,
    async () => {
      const nanashiNameResult = await getDefaultAuthorNameRepository(dbContext);
      if (nanashiNameResult.isErr()) {
        return err(nanashiNameResult.error);
      }
      return ok(nanashiNameResult.value.val);
    }
  );
  if (authorNameResult.isErr()) {
    return err(authorNameResult.error);
  }
  // メール生成
  const mailResult = createWriteMail(mailRaw);
  if (mailResult.isErr()) {
    return err(mailResult.error);
  }
  // レス内容生成
  const responseContentResult = await createWriteResponseContent(
    responseContentRaw,
    async () => {
      const result = await getMaxContentLengthRepository(dbContext);
      if (result.isErr()) {
        return err(result.error);
      }
      return ok(result.value.val);
    }
  );
  if (responseContentResult.isErr()) {
    return err(responseContentResult.error);
  }
  // 現在時刻を生成
  const postedAt = generateCurrentPostedAt();

  // ハッシュ値作成
  const hashId = generateWriteHashId(ipAddressRaw, postedAt.val);
  if (hashId.isErr()) {
    return err(hashId.error);
  }

  // レスを作成
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
    return err(response.error);
  }

  // 最後に永続化
  const responseResult = await createResponseByThreadIdRepository(
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
