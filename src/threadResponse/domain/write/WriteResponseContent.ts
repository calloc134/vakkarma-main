import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../../types/Error";

// 本文
export type WriteResponseContent = {
  readonly _type: "WriteResponseContent";
  readonly val: string;
};
export const createWriteResponseContent = async (
  value: string,
  getMaxLen: () => Promise<Result<number, Error>>
): Promise<Result<WriteResponseContent, ValidationError>> => {
  if (value.length === 0) {
    return err(new ValidationError("本文は必須です"));
  }

  const maxLen = await getMaxLen();
  if (maxLen.isErr()) {
    return err(maxLen.error);
  }

  if (value.length > maxLen.value) {
    return err(
      new ValidationError(`本文は${maxLen.value}文字以内で入力してください`)
    );
  }
  return ok({ _type: "WriteResponseContent", val: value });
};
