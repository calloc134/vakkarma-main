import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../../types/Error";

// パスワード
export type Password = {
  _type: "Password";
  val: string;
};

// Minimum 8 characters, one uppercase, one lowercase, one digit, one special character.
// const passwordRegex =
// /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const createPassword = (
  value: string | null
): Result<Password, ValidationError> => {
  if (!value || value === "") {
    return err(new ValidationError("パスワードを入力してください"));
  }
  // 強度チェックを行う場合はコメントアウトを外す
  // if (!passwordRegex.test(value)) {
  //   return err(new ValidationError("パスワードの強度が不足しています"));
  // }
  return ok({ _type: "Password", val: value });
};
