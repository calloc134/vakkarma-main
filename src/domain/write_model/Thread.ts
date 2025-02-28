import { ok, err } from "neverthrow";

import { type PostedAt } from "../value_object/PostedAt";
import {
  generateThreadEpochId,
  type ThreadEpochId,
} from "../value_object/ThreadEpochId";
import { generateThreadId, type ThreadId } from "../value_object/ThreadId";

import type { ValidationError } from "../../types/Error";
import type { ThreadTitle } from "../value_object/ThreadTitle";
import type { Result } from "neverthrow";

// スレッド
export type Thread = {
  readonly _type: "Thread";
  readonly id: ThreadId;
  readonly title: ThreadTitle;
  readonly postedAt: PostedAt;
  readonly epochId: ThreadEpochId;
  // 返信時、updatedAtも更新される
  // このときの動作は専用のリポジトリを実装してしまうことにする
  // (少しお行儀が悪いかも)
  readonly updatedAt: PostedAt;
};

// スレッドのファクトリ関数
// 外部からpostedAtを受け取るように変更。レスの方と一貫性を取るため。ユースケースで生成する
export const createThread = ({
  title,
  postedAt,
}: {
  title: ThreadTitle;
  postedAt: PostedAt;
}): Result<Thread, ValidationError> => {
  const id = generateThreadId();

  const threadEpochIdResult = generateThreadEpochId(postedAt);
  if (threadEpochIdResult.isErr()) {
    return err(threadEpochIdResult.error);
  }

  // 同じ値を利用
  const updatedAt = postedAt;

  return ok({
    _type: "Thread",
    id,
    title,
    postedAt: postedAt,
    updatedAt,
    epochId: threadEpochIdResult.value,
  });
};
