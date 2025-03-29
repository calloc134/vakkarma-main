import { err, ok } from "neverthrow";

import { generateWriteThreadEpochId } from "./WriteThreadEpochId";
import { generateWriteThreadId } from "./WriteThreadId";

import type { WritePostedAt } from "./WritePostedAt";
import type { WriteThreadEpochId } from "./WriteThreadEpochId";
import type { WriteThreadId } from "./WriteThreadId";
import type { WriteThreadTitle } from "./WriteThreadTitle";
import type { Result } from "neverthrow";

export type WriteThread = {
  readonly _type: "WriteThread";
  readonly id: WriteThreadId;
  readonly title: WriteThreadTitle;
  readonly postedAt: WritePostedAt;
  readonly epochId: WriteThreadEpochId;
  // 返信時、updatedAtも更新される
  // このときの動作は専用のリポジトリを実装してしまうことにする
  // (少しお行儀が悪いかも)
  readonly updatedAt: WritePostedAt;
};

// スレッドのファクトリ関数
// 外部からpostedAtを受け取るように変更。レスの方と一貫性を取るため。ユースケースで生成する
export const createWriteThread = ({
  title,
  postedAt,
}: {
  title: WriteThreadTitle;
  postedAt: WritePostedAt;
}): Result<WriteThread, Error> => {
  const id = generateWriteThreadId();

  const threadEpochIdResult = generateWriteThreadEpochId(postedAt);
  if (threadEpochIdResult.isErr()) {
    return err(threadEpochIdResult.error);
  }
  // 同じ値を利用
  const updatedAt = postedAt;

  return ok({
    _type: "WriteThread",
    id,
    title,
    postedAt,
    updatedAt,
    epochId: threadEpochIdResult.value,
  });
};
