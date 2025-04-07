import { ok, type Result } from "neverthrow";

import type { ValidationError } from "../../../shared/types/Error";

// 本文
export type ReadResponseContent = {
  readonly _type: "ReadResponseContent";
  readonly val: string;
};
export const createReadResponseContent = (
  value: string
): Result<ReadResponseContent, ValidationError> => {
  return ok({ _type: "ReadResponseContent", val: value });
};
