import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadMaxContentLength = {
  _type: "ReadMaxContentLength";
  val: number;
};

export const createReadMaxContentLength = (
  maxContentLength: number
): Result<ReadMaxContentLength, Error> => {
  return ok({
    _type: "ReadMaxContentLength",
    val: maxContentLength,
  });
};
