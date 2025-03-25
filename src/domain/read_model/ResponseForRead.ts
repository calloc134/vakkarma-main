import type { HashId } from "../value_object/HashId";
import type { Mail } from "../value_object/Mail";
import type { PostedAt } from "../value_object/PostedAt";
import type { ReadAuthorName } from "../value_object/ReadAuthorName";
import type { ReadResponseContent } from "../value_object/ReadResponseContent";
import type { ResponseId } from "../value_object/ResponseId";
import type { ResponseNumber } from "../value_object/ResponseNumber";
import type { ThreadId } from "../value_object/ThreadId";

export type ResponseForRead = {
  readonly _type: "ResponseForRead";
  readonly responseId: ResponseId;
  readonly threadId: ThreadId;
  readonly responseNumber: ResponseNumber;
  readonly authorName: ReadAuthorName;
  readonly mail: Mail;
  readonly postedAt: PostedAt;
  readonly responseContent: ReadResponseContent;
  readonly hashId: HashId;
};
