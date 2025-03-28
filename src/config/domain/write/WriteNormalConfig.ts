import { ok } from "neverthrow";

import type { WriteBoardName } from "./WriteBoardName";
import type { WriteDefaultAuthorName } from "./WriteDefaultAuthorName";
import type { WriteLocalRule } from "./WriteLocalRule";
import type { WriteMaxContentLength } from "./WriteMaxContentLength";
import type { ValidationError } from "../../../types/Error";
import type { Result } from "neverthrow";

export type WriteNormalConfig = {
  _type: "WriteNormalConfig";
  val: {
    boardName: WriteBoardName;
    localRule: WriteLocalRule;
    defaultAuthorName: WriteDefaultAuthorName;
    maxContentLength: WriteMaxContentLength;
  };
};
export const createNormalConfig = (
  boardName: WriteBoardName,
  localRule: WriteLocalRule,
  defaultAuthorName: WriteDefaultAuthorName,
  maxContentLength: WriteMaxContentLength
): Result<WriteNormalConfig, ValidationError> => {
  return ok({
    _type: "WriteNormalConfig",
    val: {
      boardName,
      localRule,
      defaultAuthorName,
      maxContentLength,
    },
  });
};
