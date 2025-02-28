import { ok, err, type Result } from "neverthrow";
import { uuidv7 } from "uuidv7";

import { ValidationError } from "../../types/Error";
import { validateUUIDv7 } from "../../utils/validateUUIDv7";

// レスポンスのメインID。uuidv7
export type ResponseId = {
  readonly _type: "ResponseId";
  readonly val: string;
};
export const generateResponseId = (): ResponseId => {
  const value = uuidv7();
  return { _type: "ResponseId", val: value };
};

export const createResponseId = (
  value: string
): Result<ResponseId, ValidationError> => {
  // UUIDv7のバリデーション
  if (!validateUUIDv7(value)) {
    return err(new ValidationError("不正なレスIDです"));
  }
  return ok({ _type: "ResponseId", val: value });
};
