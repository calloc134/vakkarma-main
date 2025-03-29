import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadMaxContentLength = {
  readonly _type: "ReadMaxContentLength";
  readonly val: number;
};

export const createReadMaxContentLength = (
  maxContentLength: number
): Result<ReadMaxContentLength, Error> => {
  return ok({
    _type: "ReadMaxContentLength",
    val: maxContentLength,
  });
};
