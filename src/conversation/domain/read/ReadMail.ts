import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadMail = {
  readonly _type: "ReadMail";
  readonly val: string;
};
export const createReadMail = (mail: string): Result<ReadMail, Error> => {
  return ok({
    _type: "ReadMail",
    val: mail,
  });
};
