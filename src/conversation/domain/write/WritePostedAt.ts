import { ok, type Result } from "neverthrow";

import type { ValidationError } from "../../../shared/types/Error";

// 投稿日時
export type WritePostedAt = {
  readonly _type: "WritePostedAt";
  readonly val: Date;
};

export const createWritePostedAt = (
  value: Date
): Result<WritePostedAt, ValidationError> => {
  return ok({ _type: "WritePostedAt", val: value });
};

// 現在の日時で初期化する場合
// エラーは出ないものと推測
export const generateCurrentPostedAt = (): WritePostedAt => {
  return createWritePostedAt(new Date())._unsafeUnwrap();
};
