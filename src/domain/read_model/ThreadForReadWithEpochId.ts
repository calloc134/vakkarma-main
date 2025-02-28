import type { PostedAt } from "../value_object/PostedAt";
import type { ThreadEpochId } from "../value_object/ThreadEpochId";
import type { ThreadId } from "../value_object/ThreadId";
import type { ThreadTitle } from "../value_object/ThreadTitle";

export type ThreadForReadWithEpochId = {
  readonly _type: "ThreadForReadWithEpochId";
  readonly threadId: ThreadId;
  readonly title: ThreadTitle;
  readonly postedAt: PostedAt;
  readonly updatedAt: PostedAt;
  readonly threadEpochId: ThreadEpochId;
  readonly countResponse: number;
};
