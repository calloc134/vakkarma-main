import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadThreadEpochId = {
  readonly _type: "ReadThreadEpochId";
  readonly val: number;
};

export const createReadThreadEpochId = (
  value: number
): Result<ReadThreadEpochId, Error> => {
  return ok({
    _type: "ReadThreadEpochId",
    val: value,
  });
};
