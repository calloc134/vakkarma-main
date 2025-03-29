import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadThreadTitle = {
  readonly _type: "ReadThreadTitle";
  readonly val: string;
};

export const createReadThreadTitle = (
  value: string
): Result<ReadThreadTitle, Error> => {
  return ok({
    _type: "ReadThreadTitle",
    val: value,
  });
};
