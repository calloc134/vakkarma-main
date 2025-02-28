import type { PostedAt } from "../value_object/PostedAt";
import type { ThreadId } from "../value_object/ThreadId";
import type { ThreadTitle } from "../value_object/ThreadTitle";

export type ThreadForRead = {
  readonly _type: "ThreadForRead";
  readonly threadId: ThreadId;
  readonly title: ThreadTitle;
  readonly postedAt: PostedAt;
  readonly updatedAt: PostedAt;
  readonly countResponse: number
};
