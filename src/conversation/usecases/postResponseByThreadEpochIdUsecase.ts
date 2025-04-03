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
import { createResponseByThreadIdRepository } from "../repositories/createResponseByThreadIdRepository";
import { getThreadIdByThreadEpochIdRepository } from "../repositories/getThreadIdByThreadEpochIdRepository";

import type { DbContext } from "../../types/DbContext";

// レスを投稿する際のユースケース
export const postResponseByThreadEpochIdUsecase = async (
  dbContext: DbContext,
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
  // ThreadEpochIdを生成
  const threadEpochIdResult = createWriteThreadEpochId(threadEpochIdRaw);
  if (threadEpochIdResult.isErr()) {
    return err(threadEpochIdResult.error);
  }

  // ThreadIdを取得
  const threadIdResult = await getThreadIdByThreadEpochIdRepository(dbContext, {
    threadEpochId: threadEpochIdResult.value,
  });
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
    // 高階関数パターン必要なかったかも
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
