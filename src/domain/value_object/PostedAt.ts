import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../types/Error";

// 投稿日時
export type PostedAt = {
  readonly _type: "PostedAt";
  readonly val: Date;
};

export const createPostedAt = (
  value: Date
): Result<PostedAt, ValidationError> => {
  if (!value) {
    return err(new ValidationError("日時は必須です"));
  }
  return ok({ _type: "PostedAt", val: value });
};

// 現在の日時で初期化する場合
export const generateCurrentPostedAt = (): Result<
  PostedAt,
  ValidationError
> => {
  return createPostedAt(new Date());
};
