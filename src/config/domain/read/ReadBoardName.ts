import { ok } from "neverthrow";

import type { Result } from "neverthrow";

export type ReadBoardName = {
  readonly _type: "ReadBoardName";
  readonly val: string;
};

export const createReadBoardName = (
  boardName: string
): Result<ReadBoardName, Error> => {
  return ok({
    _type: "ReadBoardName",
    val: boardName,
  });
};
