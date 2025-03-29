import { ok, err, type Result } from "neverthrow";

export type WriteMaxContentLength = {
  readonly _type: "WriteMaxContentLength";
  readonly val: number;
};

export const createMaxContentLength = (
  value: number
): Result<WriteMaxContentLength, string> => {
  if (value <= 0) {
    return err("コンテンツの最大長は0より大きい必要があります");
  }
  return ok({ _type: "WriteMaxContentLength", val: value });
};
