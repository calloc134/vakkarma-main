import { ok, err, type Result } from "neverthrow";
import { uuidv7 } from "uuidv7";

import { ValidationError } from "../../../types/Error";
import { validateUUIDv7 } from "../../../utils/validateUUIDv7";

// スレッドのメインID。uuidv7
export type WriteThreadId = {
  readonly _type: "WriteThreadId";
  readonly val: string;
};
export const generateWriteThreadId = (): WriteThreadId => {
  const value = uuidv7();
  return { _type: "WriteThreadId", val: value };
};

export const createWriteThreadId = (
  value: string
): Result<WriteThreadId, ValidationError> => {
  // UUIDv7のバリデーション
  if (!validateUUIDv7(value)) {
    return err(new ValidationError("不正なスレッドIDです"));
  }
  return ok({ _type: "WriteThreadId", val: value });
};
