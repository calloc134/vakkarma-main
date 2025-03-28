import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../../types/Error";

import type { Nominal } from "../../../types/Nominal";

export type WritePassword = Nominal<string, "WritePassword">;

// 8文字以上、大文字、小文字、数字、特殊文字を1つ以上含む
// const passwordRegex =
// /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const createWritePassword = (
  value: string | null
): Result<WritePassword, ValidationError> => {
  if (!value || value === "") {
    return err(new ValidationError("パスワードを入力してください"));
  }
  return ok(value as WritePassword);
};
