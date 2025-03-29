import { ok, err, type Result } from "neverthrow";
import { uuidv7 } from "uuidv7";

import { ValidationError } from "../../../types/Error";
import { validateUUIDv7 } from "../../../utils/validateUUIDv7";

// レスポンスのメインID。uuidv7
export type WriteResponseId = {
  readonly _type: "WriteResponseId";
  readonly val: string;
};
export const generateResponseId = (): WriteResponseId => {
  const value = uuidv7();
  return { _type: "WriteResponseId", val: value };
};

export const createResponseId = (
  value: string
): Result<WriteResponseId, ValidationError> => {
  // UUIDv7のバリデーション
  if (!validateUUIDv7(value)) {
    return err(new ValidationError("不正なレスIDです"));
  }
  return ok({ _type: "WriteResponseId", val: value });
};
