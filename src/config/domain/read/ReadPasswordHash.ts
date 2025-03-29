import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadPasswordHash = {
  readonly _type: "ReadPasswordHash";
  readonly val: string;
};

export const createReadPasswordHash = (
  passwordHash: string
): Result<ReadPasswordHash, Error> => {
  return ok({
    _type: "ReadPasswordHash",
    val: passwordHash,
  });
};
