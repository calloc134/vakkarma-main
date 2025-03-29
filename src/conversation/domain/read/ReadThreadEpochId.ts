import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadThreadEpochId = {
  readonly _type: "ReadThreadEpochId";
  readonly val: string;
};

export const createReadThreadEpochId = (
  threadEpochId: string
): Result<ReadThreadEpochId, Error> => {
  return ok({
    _type: "ReadThreadEpochId",
    val: threadEpochId,
  });
};
