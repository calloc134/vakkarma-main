import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadThreadId = {
  readonly _type: "ReadThreadId";
  readonly val: string;
};

export const createReadThreadId = (
  value: string
): Result<ReadThreadId, Error> => {
  return ok({
    _type: "ReadThreadId",
    val: value,
  });
};
