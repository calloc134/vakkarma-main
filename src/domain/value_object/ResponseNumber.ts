import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../types/Error";

export type ResponseNumber = {
  readonly _type: "ResponseNumber";
  readonly val: number;
};
export const createResponseNumber = (
  value: number
): Result<ResponseNumber, ValidationError> => {
  if (value < 1) {
    return err(new ValidationError("レス番号は1以上です"));
  }

  return ok({ _type: "ResponseNumber", val: value });
};
