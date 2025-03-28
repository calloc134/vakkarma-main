import { ok } from "neverthrow";

import type { ReadBoardName } from "./ReadBoardName";
import type { ReadDefaultAuthorName } from "./ReadDefaultAuthorName";
import type { ReadLocalRule } from "./ReadLocalRule";
import type { ReadMaxContentLength } from "./ReadMaxContentLength";
import type { Result } from "neverthrow";

export type ReadNormalConfig = {
  _type: "ReadNormalConfig";
  val: {
    boardName: ReadBoardName;
    localRule: ReadLocalRule;
    defaultAuthorName: ReadDefaultAuthorName;
    maxContentLength: ReadMaxContentLength;
  };
};

export const createReadNormalConfig = (
  boardName: ReadBoardName,
  localRule: ReadLocalRule,
  defaultAuthorName: ReadDefaultAuthorName,
  maxContentLength: ReadMaxContentLength
): Result<ReadNormalConfig, Error> => {
  return ok({
    _type: "ReadNormalConfig",
    val: {
      boardName,
      localRule,
      defaultAuthorName,
      maxContentLength,
    },
  });
};
