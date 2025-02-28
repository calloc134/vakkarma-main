import { err, ok } from "neverthrow";

import { generateHashId } from "../domain/value_object/HashId";
import { createMail } from "../domain/value_object/Mail";
import { generateCurrentPostedAt } from "../domain/value_object/PostedAt";
import { createReadAuthorName } from "../domain/value_object/ReadAuthorName";
import { createResponseContent } from "../domain/value_object/ResponseContent";
import { createThreadEpochId } from "../domain/value_object/ThreadEpochId";
import { createWriteAuthorName } from "../domain/value_object/WriteAuthorName";
import { createResponse } from "../domain/write_model/Response";
import { createResponseRepository } from "../repositories/createResponseRepository";
import { getThreadIdByThreadEpochIdRepository } from "../repositories/getThreadIdByThreadEpochIdRepository";
import { updateThreadUpdatedAtRepository } from "../repositories/updateThreadUpdatedAtRepository";

import type { DbContext } from "../types/DbContext";

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
  const threadEpochIdResult = createThreadEpochId(threadEpochIdRaw);
  if (threadEpochIdResult.isErr()) {
    return err(threadEpochIdResult.error);
  }
  // ユーザ名を生成
  const authorNameResult = await createWriteAuthorName(
    authorNameRaw,
    async () => {
      const nanashiNameResult = createReadAuthorName("名無しさん", null);
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
  const responseContentResult = createResponseContent(responseContentRaw);
  if (responseContentResult.isErr()) {
    return err(responseContentResult.error);
  }
  // 現在時刻を生成
  const postedAt = generateCurrentPostedAt()._unsafeUnwrap(); // ここでエラーが出ることはない

  // ハッシュ値作成
  const hashIdResult = generateHashId(ipAddressRaw, postedAt.val);
  if (hashIdResult.isErr()) {
    return err(hashIdResult.error);
  }

  // スレッドIDを取得
  // リポジトリを分けるべきなのか専用のリポジトリを作るべきなのかは要検討
  const threadId = await getThreadIdByThreadEpochIdRepository(dbContext, {
    threadEpochId: threadEpochIdResult.value,
  });
  if (threadId.isErr()) {
    return err(threadId.error);
  }

  // レスを作成
  const response = createResponse({
    threadId: threadId.value,
    authorName: authorNameResult.value,
    mail: mailResult.value,
    responseContent: responseContentResult.value,
    hashId: hashIdResult.value,
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
    threadId: threadId.value,
    updatedAt: postedAt,
  });
  if (threadResult.isErr()) {
    return err(threadResult.error);
  }

  return ok(undefined);
};
