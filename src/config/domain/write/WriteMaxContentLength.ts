import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../../shared/types/Error";

export type WriteMaxContentLength = {
  readonly _type: "WriteMaxContentLength";
  readonly val: number;
};

export const createWriteMaxContentLength = (
  value: number
): Result<WriteMaxContentLength, ValidationError> => {
  if (value <= 0) {
    return err(
      new ValidationError("コンテンツの最大長は0より大きい必要があります")
    );
  }
  return ok({ _type: "WriteMaxContentLength", val: value });
};
