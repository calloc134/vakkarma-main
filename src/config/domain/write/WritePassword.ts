import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../../types/Error";

// パスワード
export type WritePassword = {
  _type: "WritePassword";
  val: string;
};

// Minimum 8 characters, one uppercase, one lowercase, one digit, one special character.
// const passwordRegex =
//   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export const createPassword = async (
  value: string
  //   getIsPasswordStrength: () => Promise<Result<boolean, Error>>
): Promise<Result<WritePassword, ValidationError>> => {
  if (value.length === 0) {
    return err(new ValidationError("パスワードを入力してください"));
  }

  //   const isPasswordStrengthResult = await getIsPasswordStrength();
  //   if (isPasswordStrengthResult.isErr()) {
  //     return err(isPasswordStrengthResult.error);
  //   }

  //   if (!isPasswordStrengthResult.value || !passwordRegex.test(value)) {
  //     return err(new ValidationError("パスワードの強度が不足しています"));
  //   }
  return ok({ _type: "WritePassword", val: value });
};
