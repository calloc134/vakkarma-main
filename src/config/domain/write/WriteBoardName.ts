import { err, ok } from "neverthrow";

import { ValidationError } from "../../../shared/types/Error";

import type { Result } from "neverthrow";

export type WriteBoardName = {
  readonly _type: "WriteBoardName";
  readonly val: string;
};

export const createWriteBoardName = (
  value: string
): Result<WriteBoardName, ValidationError> => {
  if (value.length === 0) {
    return err(new ValidationError("ボード名は必須です"));
  }

  if (value.length > 50) {
    return err(new ValidationError("ボード名は50文字以内で入力してください"));
  }
  return ok({ _type: "WriteBoardName", val: value });
};
