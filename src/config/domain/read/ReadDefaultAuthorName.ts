import { ok, type Result } from "neverthrow";

export type ReadDefaultAuthorName = {
  _type: "ReadDefaultAuthorName";
  val: string;
};

export const createReadDefaultAuthorName = (
  defaultAuthorName: string
): Result<ReadDefaultAuthorName, Error> => {
  return ok({
    _type: "ReadDefaultAuthorName",
    val: defaultAuthorName,
  });
};
