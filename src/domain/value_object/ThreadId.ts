import { ok, err, type Result } from "neverthrow";
import { uuidv7 } from "uuidv7";

import { ValidationError } from "../../types/Error";
import { validateUUIDv7 } from "../../utils/validateUUIDv7";

// スレッドのメインID。uuidv7
export type ThreadId = {
  readonly _type: "ThreadId";
  readonly val: string;
};
export const generateThreadId = (): ThreadId => {
  const value = uuidv7();
  return { _type: "ThreadId", val: value };
};

export const createThreadId = (
  value: string
): Result<ThreadId, ValidationError> => {
  // UUIDv7のバリデーション
  if (!validateUUIDv7(value)) {
    return err(new ValidationError("不正なスレッドIDです"));
  }
  return ok({ _type: "ThreadId", val: value });
};
