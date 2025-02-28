import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../types/Error";

// メールアドレス
export type Mail = {
  readonly _type: "Mail";
  readonly val: string;
};

// https://zenn.dev/igz0/articles/email-validation-regex-best-practices
const regexMail =
  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const createMail = (
  value: string | null
): Result<Mail, ValidationError> => {
  if (value === null) {
    return ok({ _type: "Mail", val: "" });
  }
  if (value.length > 255) {
    return err(new ValidationError("メールアドレスは255文字以内です"));
  }
  // 簡単なメールアドレス形式チェック (厳密なものではない)
  if (
    value !== "" &&
    !regexMail.test(value) &&
    value.toLowerCase() !== "sage"
  ) {
    return err(new ValidationError("不正なメールアドレス形式です"));
  }
  return ok({ _type: "Mail", val: value });
};
