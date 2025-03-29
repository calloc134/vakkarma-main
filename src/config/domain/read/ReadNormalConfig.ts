import { ok } from "neverthrow";

import type { ReadBoardName } from "./ReadBoardName";
import type { ReadDefaultAuthorName } from "./ReadDefaultAuthorName";
import type { ReadLocalRule } from "./ReadLocalRule";
import type { ReadMaxContentLength } from "./ReadMaxContentLength";
import type { Result } from "neverthrow";

export type ReadNormalConfig = {
  readonly _type: "ReadNormalConfig";
  readonly boardName: ReadBoardName;
  readonly localRule: ReadLocalRule;
  readonly defaultAuthorName: ReadDefaultAuthorName;
  readonly maxContentLength: ReadMaxContentLength;
};

export const createReadNormalConfig = ({
  boardName,
  localRule,
  defaultAuthorName,
  maxContentLength,
}: {
  boardName: ReadBoardName;
  localRule: ReadLocalRule;
  defaultAuthorName: ReadDefaultAuthorName;
  maxContentLength: ReadMaxContentLength;
}): Result<ReadNormalConfig, Error> => {
  return ok({
    _type: "ReadNormalConfig",
    boardName,
    localRule,
    defaultAuthorName,
    maxContentLength,
  });
};
