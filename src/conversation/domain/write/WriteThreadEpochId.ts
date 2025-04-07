import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../../shared/types/Error";

// 書き込み時に生成するのでWritePostedAtを受け付けるはず
import type { WritePostedAt } from "./WritePostedAt";

// スレッドのepoch ID。datでアクセスするときにのみ利用する
export type WriteThreadEpochId = {
  readonly _type: "WriteThreadEpochId";
  readonly val: number;
};
//postedAtを元に、秒単位のepochとしてスレッドIDを生成
export const generateWriteThreadEpochId = (
  postedAt: WritePostedAt
): Result<WriteThreadEpochId, ValidationError> => {
  const value = Math.floor(postedAt.val.getTime() / 1000);

  return ok({ _type: "WriteThreadEpochId", val: value });
};

export const createWriteThreadEpochId = (
  value: string
): Result<WriteThreadEpochId, ValidationError> => {
  if (value === "") {
    return err(new ValidationError("ThreadEpochIdは空文字列にできません"));
  }
  // BIGINTを扱うため、数値に変換
  const epochId = Number(value);
  if (isNaN(epochId)) {
    return err(new ValidationError("ThreadEpochIdは数値である必要があります"));
  }
  return ok({ _type: "WriteThreadEpochId", val: epochId });
};
