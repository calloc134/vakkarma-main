import { err, ok } from "neverthrow";

import type { Result } from "neverthrow";

export type WriteBoardName = {
  readonly _type: "WriteBoardName";
  readonly val: string;
};

export const createBoardName = (
  value: string
): Result<WriteBoardName, string> => {
  if (value.length === 0) {
    return err("ボード名を入力してください");
  }

  if (value.length > 20) {
    return err("ボード名は20文字以内で入力してください");
  }
  return ok({ _type: "WriteBoardName", val: value });
};
