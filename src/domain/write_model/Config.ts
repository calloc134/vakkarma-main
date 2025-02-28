import { compare } from "bcrypt-ts";
import { err, ok, type Result } from "neverthrow";

import { PasswordDoesNotMatchError } from "../../types/Error";

// 掲示板の設定
export type Config = {
  readonly _type: "Config";
  readonly boardName: string;
  readonly localRule: string;
  readonly nanashiName: string;
  readonly maxContentLength: number;
};

// 掲示板の設定のファクトリ関数
// 名無しの場合の値などもconfigに含まれるが、configエンティティでは必要ないと判断
export const createConfig = async ({
  boardName,
  localRule,
  nanashiName,
  maxContentLength,
  inputPassword,
  getCurrentPasswordHash,
}: {
  boardName: string;
  localRule: string;
  maxContentLength: number;
  nanashiName: string;
  // 指定されたパスワード
  inputPassword: string;
  // 現在のパスワードのハッシュを返す関数
  getCurrentPasswordHash: () => Promise<Result<string, Error>>;
}): Promise<Result<Config, Error>> => {
  const currentPasswordHash = await getCurrentPasswordHash();
  if (currentPasswordHash.isErr()) {
    return err(currentPasswordHash.error);
  }
  if ((await compare(inputPassword, currentPasswordHash.value)) === false) {
    return err(new PasswordDoesNotMatchError("パスワードが一致しません"));
  }

  return ok({
    _type: "Config",
    boardName,
    localRule,
    nanashiName,
    maxContentLength,
  });
};
