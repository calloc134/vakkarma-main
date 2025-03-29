import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadResponseNumber = {
  readonly _type: "ReadResponseNumber";
  readonly val: number;
};

export const createReadResponseNumber = (
  value: number
): Result<ReadResponseNumber, Error> => {
  return ok({
    _type: "ReadResponseNumber",
    val: value,
  });
};
