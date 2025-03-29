import { hash } from "bcrypt-ts";
import { ok, err } from "neverthrow";

import { ValidationError } from "../../../types/Error";

import type { WritePassword } from "./WritePassword";
import type { Result } from "neverthrow";

export type WritePasswordHash = {
  readonly _type: "WritePasswordHash";
  readonly val: string;
};

export const generatePasswordHash = async (
  password: WritePassword
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
