import { ok, err } from "neverthrow";

import { ValidationError } from "../../../types/Error";

import type { Result } from "neverthrow";

export type WriteDefaultAuthorName = {
  readonly _type: "WriteDefaultAuthorName";
  readonly val: string;
};

export const createDefaultAuthorName = (
  value: string
): Result<WriteDefaultAuthorName, ValidationError> => {
  if (value.length === 0) {
    return err(new ValidationError("デフォルトのユーザ名を入力してください"));
  }

  if (value.length > 20) {
    return err(
      new ValidationError("デフォルトのユーザ名は20文字以内で入力してください")
    );
  }
  return ok({ _type: "WriteDefaultAuthorName", val: value });
};
