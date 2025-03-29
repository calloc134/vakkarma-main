import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadPostedAt = {
  readonly _type: "ReadPostedAt";
  readonly val: Date;
};

export const createReadPostedAt = (
  postedAt: Date
): Result<ReadPostedAt, Error> => {
  return ok({
    _type: "ReadPostedAt",
    val: postedAt,
  });
};
