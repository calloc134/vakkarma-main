import { ok } from "neverthrow";

import type { ReadBoardName } from "./ReadBoardName";
import type { ReadLocalRule } from "./ReadLocalRule";
import type { Result } from "neverthrow";

export type ReadBoardConfig = {
  readonly _type: "ReadBoardConfig";
  readonly boardName: ReadBoardName;
  readonly localRule: ReadLocalRule;
};

export const createReadBoardConfig = ({
  boardName,
  localRule,
}: {
  boardName: ReadBoardName;
  localRule: ReadLocalRule;
}): Result<ReadBoardConfig, Error> => {
  return ok({
    _type: "ReadBoardConfig",
    boardName,
    localRule,
  });
};
