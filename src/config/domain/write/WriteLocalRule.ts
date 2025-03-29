import { err, ok } from "neverthrow";

import { ValidationError } from "../../../types/Error";

import type { Result } from "neverthrow";

export type WriteLocalRule = {
  readonly _type: "WriteLocalRule";
  readonly val: string;
};

export const createWriteLocalRule = (
  value: string
): Result<WriteLocalRule, ValidationError> => {
  if (value.length === 0) {
    return err(new ValidationError("ローカルルールを入力してください"));
  }

  if (value.length > 100) {
    return err(
      new ValidationError("ローカルルールは100文字以内で入力してください")
    );
  }
  return ok({ _type: "WriteLocalRule", val: value });
};
