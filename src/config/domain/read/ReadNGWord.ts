import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadNGWord = {
  readonly _type: "ReadNGWord";
  readonly val: string;
};

export const createReadNGWord = (val: string): Result<ReadNGWord, Error> => {
  return ok({ _type: "ReadNGWord", val });
};
