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

import type { DbContext } from "../../types/DbContext";

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
  const threadTitleResult = createWriteThreadTitle(threadTitleRaw);
  if (threadTitleResult.isErr()) {
    return err(threadTitleResult.error);
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

  // まずスレッド作成
  const thread = createWriteThread({
    title: threadTitleResult.value,
    postedAt,
  });
  if (thread.isErr()) {
    return err(thread.error);
  }

  // 一番目のレスも作成
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
    return err(response.error);
  }

  // 最後に永続化
  // 先にレスを作成したほうが安全側に倒せそう
  const responseResult = await createResponseByThreadIdRepository(
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
