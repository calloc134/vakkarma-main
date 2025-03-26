import { hash } from "bcrypt-ts";
import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../types/Error";

// パスワード
export type Password = {
  _type: "Password";
  val: string;
};

// Minimum 8 characters, one uppercase, one lowercase, one digit, one special character.
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const createPassword = (
  value: string | null
): Result<Password, ValidationError> => {
  if (!value || value === "") {
    return err(new ValidationError("パスワードを入力してください"));
  }
  if (!passwordRegex.test(value)) {
    return err(new ValidationError("パスワードの強度が不足しています"));
  }
  return ok({ _type: "Password", val: value });
};

export type WritePasswordHash = {
  _type: "WritePasswordHash";
  val: string;
};

export const generatePasswordHash = async (
  password: Password
): Promise<Result<WritePasswordHash, ValidationError>> => {
  try {
    const hashedPassword = await hash(password.val, 10);
    return ok({ _type: "WritePasswordHash", val: hashedPassword });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new ValidationError(`パスワードのハッシュ化に失敗しました: ${message}`)
    );
  }
};
