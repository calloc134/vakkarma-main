import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadLocalRule = {
  _type: "ReadLocalRule";
  val: string;
};

export const createReadLocalRule = (
  localRule: string
): Result<ReadLocalRule, Error> => {
  return ok({
    _type: "ReadLocalRule",
    val: localRule,
  });
};
