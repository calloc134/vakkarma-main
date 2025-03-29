import { ok } from "neverthrow";

import type { ReadBoardName } from "./ReadBoardName";
import type { ReadLocalRule } from "./ReadLocalRule";
import type { Result } from "neverthrow";

export type ReadBoardConfig = {
  readonly _type: "ReadBoardConfig";
  readonly val: {
    readonly boardName: ReadBoardName;
    readonly localRule: ReadLocalRule;
  };
};

export const createReadBoardConfig = (
  boardName: ReadBoardName,
  localRule: ReadLocalRule
): Result<ReadBoardConfig, Error> => {
  return ok({
    _type: "ReadBoardConfig",
    val: {
      boardName,
      localRule,
    },
  });
};
