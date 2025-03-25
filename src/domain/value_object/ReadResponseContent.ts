import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../types/Error";

// 本文
export type ReadResponseContent = {
  readonly _type: "ReadResponseContent";
  readonly val: string;
};
export const createReadResponseContent = (
  value: string
): Result<ReadResponseContent, ValidationError> => {
  if (value.length === 0) {
    return err(new ValidationError("本文は必須です"));
  }
  return ok({ _type: "ReadResponseContent", val: value });
};
