import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../types/Error";

// 本文
export type ResponseContent = {
  readonly _type: "ResponseContent";
  readonly val: string;
};
export const createResponseContent = (
  value: string
): Result<ResponseContent, ValidationError> => {
  if (value.length === 0) {
    return err(new ValidationError("本文は必須です"));
  }
  if (value.length > 1000) {
    return err(new ValidationError("本文は1000文字以内です"));
  }
  return ok({ _type: "ResponseContent", val: value });
};
