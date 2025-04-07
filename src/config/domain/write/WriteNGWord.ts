import { ok, err } from "neverthrow";

import { ValidationError } from "../../../shared/types/Error";

import type { Result } from "neverthrow";

export type WriteNGWord = {
  readonly _type: "WriteNGWord";
  readonly val: string;
};

export const createWriteNGWord = (
  val: string
): Result<WriteNGWord, ValidationError> => {
  if (val.length === 0) {
    return err(new ValidationError("NGワードを入力してください"));
  }

  if (val.length > 100) {
    return err(new ValidationError("NGワードは100文字以内で入力してください"));
  }

  return ok({ _type: "WriteNGWord", val });
};
