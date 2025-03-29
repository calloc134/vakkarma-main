import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadResponseId = {
  readonly _type: "ReadResponseId";
  readonly val: string;
};

export const createReadResponseId = (
  value: string
): Result<ReadResponseId, Error> => {
  return ok({
    _type: "ReadResponseId",
    val: value,
  });
};
