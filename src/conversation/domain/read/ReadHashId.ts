import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadHashId = {
  readonly _type: "ReadHashId";
  readonly val: string;
};

export const createReadHashId = (hashId: string): Result<ReadHashId, Error> => {
  return ok({
    _type: "ReadHashId",
    val: hashId,
  });
};
