import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../types/Error";

import type { PostedAt } from "./PostedAt";

// スレッドのepoch ID。datでアクセスするときにのみ利用する
export type ThreadEpochId = {
  readonly _type: "ThreadEpochId";
  readonly val: number;
};
//postedAtを元に、秒単位のepochとしてスレッドIDを生成
export const generateThreadEpochId = (
  postedAt: PostedAt
): Result<ThreadEpochId, ValidationError> => {
  const value = Math.floor(postedAt.val.getTime() / 1000);

  return ok({ _type: "ThreadEpochId", val: value });
};

export const createThreadEpochId = (
  value: string
): Result<ThreadEpochId, ValidationError> => {
  // BIGINTを扱うため、数値に変換
  const epochId = Number(value);
  if (isNaN(epochId)) {
    return err(new ValidationError("ThreadEpochIdは数値である必要があります"));
  }
  return ok({ _type: "ThreadEpochId", val: epochId });
};
