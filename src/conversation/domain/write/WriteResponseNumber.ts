import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../../types/Error";

export type WriteResponseNumber = {
  readonly _type: "WriteResponseNumber";
  readonly val: number;
};
export const createWriteResponseNumber = (
  value: number
): Result<WriteResponseNumber, ValidationError> => {
  if (value < 1) {
    return err(new ValidationError("レス番号は1以上です"));
  }

  return ok({ _type: "WriteResponseNumber", val: value });
};
