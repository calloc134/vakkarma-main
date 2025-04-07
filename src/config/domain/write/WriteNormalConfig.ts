import { ok } from "neverthrow";

import type { WriteBoardName } from "./WriteBoardName";
import type { WriteDefaultAuthorName } from "./WriteDefaultAuthorName";
import type { WriteLocalRule } from "./WriteLocalRule";
import type { WriteMaxContentLength } from "./WriteMaxContentLength";
import type { ValidationError } from "../../../shared/types/Error";
import type { Result } from "neverthrow";

export type WriteNormalConfig = {
  readonly _type: "WriteNormalConfig";
  readonly boardName: WriteBoardName;
  readonly localRule: WriteLocalRule;
  readonly defaultAuthorName: WriteDefaultAuthorName;
  readonly maxContentLength: WriteMaxContentLength;
};
export const createWriteNormalConfig = ({
  boardName,
  localRule,
  defaultAuthorName,
  maxContentLength,
}: {
  boardName: WriteBoardName;
  localRule: WriteLocalRule;
  defaultAuthorName: WriteDefaultAuthorName;
  maxContentLength: WriteMaxContentLength;
}): Result<WriteNormalConfig, ValidationError> => {
  return ok({
    _type: "WriteNormalConfig",
    boardName,
    localRule,
    defaultAuthorName,
    maxContentLength,
  });
};
