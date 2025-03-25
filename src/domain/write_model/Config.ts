import { ok, type Result } from "neverthrow";

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
}: {
  boardName: string;
  localRule: string;
  maxContentLength: number;
  nanashiName: string;
}): Promise<Result<Config, Error>> => {
  return ok({
    _type: "Config",
    boardName,
    localRule,
    nanashiName,
    maxContentLength,
  });
};
