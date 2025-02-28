import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../types/Error";

// スレッドタイトル
export type ThreadTitle = {
  readonly _type: "ThreadTitle";
  readonly val: string;
};

const titleRegex = /^[^<>]+$/;

export const createThreadTitle = (
  value: string
): Result<ThreadTitle, ValidationError> => {
  if (value.length === 0) {
    return err(new ValidationError("スレッドタイトルは必須です"));
  }
  if (value.length > 100) {
    return err(new ValidationError("スレッドタイトルは100文字以内です"));
  }
  // 使えない文字が含まれていないかチェック
  if (!titleRegex.test(value)) {
    return err(
      new ValidationError("スレッドタイトルに使えない文字が含まれています")
    );
  }
  return ok({ _type: "ThreadTitle", val: value });
};
