import { err, ok } from "neverthrow";

import { generateResponseId } from "./WriteResponseId";
import { createWriteThreadId, type WriteThreadId } from "./WriteThreadId";

import type { WriteAuthorName } from "./WriteAuthorName";
import type { WriteHashId } from "./WriteHashId";
import type { WriteMail } from "./WriteMail";
import type { WritePostedAt } from "./WritePostedAt";
import type { WriteResponseContent } from "./WriteResponseContent";
import type { WriteResponseId } from "./WriteResponseId";
import type { Result } from "neverthrow";

export type WriteResponse = {
  readonly _type: "WriteResponse";
  readonly id: WriteResponseId;
  readonly authorName: WriteAuthorName;
  readonly mail: WriteMail;
  readonly postedAt: WritePostedAt;
  readonly responseContent: WriteResponseContent;
  readonly hashId: WriteHashId;
  readonly threadId: WriteThreadId;
};

export const createWriteResponse = async ({
  authorName,
  mail,
  responseContent,
  hashId,
  postedAt,
  getThreadId,
}: {
  authorName: WriteAuthorName;
  mail: WriteMail;
  responseContent: WriteResponseContent;
  hashId: WriteHashId;
  postedAt: WritePostedAt;
  getThreadId: () => Promise<Result<string, Error>>;
}): Promise<Result<WriteResponse, Error>> => {
  // スレッドのIDを取得
  const getThreadIdResult = await getThreadId();
  if (getThreadIdResult.isErr()) {
    return err(getThreadIdResult.error);
  }

  // 詰め替えが必要
  const createThreadIdResult = createWriteThreadId(getThreadIdResult.value);
  if (createThreadIdResult.isErr()) {
    return err(createThreadIdResult.error);
  }

  const id = generateResponseId();
  return ok({
    _type: "WriteResponse",
    id,
    authorName,
    threadId: createThreadIdResult.value,
    mail,
    postedAt,
    responseContent,
    hashId,
  });
};
