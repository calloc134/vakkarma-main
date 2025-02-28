import { ok, type Result } from "neverthrow";

// 掲示板の設定
export type BoardConfig = {
  readonly _type: "BoardConfig";
  readonly boardName: string;
  readonly localRule: string;
};

// 掲示板の設定のファクトリ関数
// 名無しの場合の値などもconfigに含まれるが、configエンティティでは必要ないと判断
export const createBoardConfig = ({
  boardName,
  localRule,
}: {
  boardName: string;
  localRule: string;
}): Result<BoardConfig, never> => {
  return ok({
    _type: "BoardConfig",
    boardName,
    localRule,
  });
};
