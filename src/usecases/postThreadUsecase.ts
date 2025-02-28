import { err, ok } from "neverthrow";

import { generateHashId } from "../domain/value_object/HashId";
import { createMail } from "../domain/value_object/Mail";
import { generateCurrentPostedAt } from "../domain/value_object/PostedAt";
import { createResponseContent } from "../domain/value_object/ResponseContent";
import { createThreadTitle } from "../domain/value_object/ThreadTitle";
import { createWriteAuthorName } from "../domain/value_object/WriteAuthorName";
import { createResponse } from "../domain/write_model/Response";
import { createThread } from "../domain/write_model/Thread";
import { createResponseRepository } from "../repositories/createResponseRepository";
import { createThreadRepository } from "../repositories/createThreadRepository";
import { getNanashiConfigRepository } from "../repositories/getNanashiConfigRepository";

import type { DbContext } from "../types/DbContext";

// スレッドを投稿する際のユースケース
export const postThreadUsecase = async (
  dbContext: DbContext,
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
  // スレタイを生成
  const threadTitleResult = createThreadTitle(threadTitleRaw);
  if (threadTitleResult.isErr()) {
    return err(threadTitleResult.error);
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
  const responseContentResult = createResponseContent(responseContentRaw);
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

  // まずスレッド作成
  const thread = createThread({
    title: threadTitleResult.value,
    postedAt,
  });
  if (thread.isErr()) {
    return err(thread.error);
  }

  // 一番目のレスも作成
  const response = createResponse({
    threadId: thread.value.id,
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
  // 先にレスを作成したほうが安全側に倒せそう
  const responseResult = await createResponseRepository(
    dbContext,
    response.value
  );
  if (responseResult.isErr()) {
    return err(responseResult.error);
  }

  const threadResult = await createThreadRepository(dbContext, thread.value);
  if (threadResult.isErr()) {
    return err(threadResult.error);
  }

  return ok(threadResult.value);
};
