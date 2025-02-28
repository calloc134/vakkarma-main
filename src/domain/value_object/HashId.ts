import crypto from "crypto";

import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../types/Error";

// ハッシュID
export type HashId = {
  readonly _type: "HashId";
  readonly val: string;
};

// ipAddressが文字列なのは妥協
export const generateHashId = (
  ipAddress: string,
  date: Date
): Result<HashId, ValidationError> => {
  try {
    const hash = crypto
      .createHash("md5")
      .update(ipAddress)
      .update(date.toDateString())
      .digest("base64");
    return ok({ _type: "HashId", val: hash.substring(0, 8) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return err(
      new ValidationError(`ハッシュIDの生成に失敗しました: ${message}`)
    );
  }
};

export const createHashId = (
  value: string
): Result<HashId, ValidationError> => {
  if (value.length !== 8) {
    return err(new ValidationError("ハッシュIDは8文字です"));
  }
  return ok({ _type: "HashId", val: value });
};
