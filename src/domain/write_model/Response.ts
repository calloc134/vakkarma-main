import { ok } from "neverthrow";

import { type HashId } from "../value_object/HashId";
import { type Mail } from "../value_object/Mail";
import { type PostedAt } from "../value_object/PostedAt";
import {
  generateResponseId,
  type ResponseId,
} from "../value_object/ResponseId";
import { type ThreadId } from "../value_object/ThreadId";

import type { WriteAuthorName } from "../value_object/WriteAuthorName";
import type { WriteResponseContent } from "../value_object/WriteResponseContent";
import type { Result } from "neverthrow";

// レスポンス
// レスを書き込む場合、スレッドのupdated_atも更新する必要があるが
// 前述の通り、例外のリポジトリを実装して処理するものとする
export type Response = {
  readonly _type: "Response";
  readonly id: ResponseId;
  readonly authorName: WriteAuthorName;
  readonly mail: Mail;
  readonly postedAt: PostedAt;
  readonly responseContent: WriteResponseContent;
  readonly hashId: HashId;
  readonly threadId: ThreadId;
};

// レスポンスのファクトリ関数
export const createResponse = ({
  threadId,
  authorName,
  mail,
  responseContent,
  hashId,
  postedAt,
}: {
  threadId: ThreadId;
  authorName: WriteAuthorName;
  mail: Mail;
  responseContent: WriteResponseContent;
  hashId: HashId;
  postedAt: PostedAt;
}): Result<Response, never> => {
  const id = generateResponseId();
  return ok({
    _type: "Response",
    id,
    threadId,
    authorName,
    mail,
    postedAt,
    responseContent,
    hashId,
  });
};
