import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../types/Error";

type SomeReadAuthorName = {
  readonly _type: "some";
  readonly authorName: string;
  readonly trip: string;
};

type NoneReadAuthorName = {
  readonly _type: "none";
  readonly authorName: string;
};

// 投稿者名
export type ReadAuthorName = {
  readonly _type: "ReadAuthorName";
  // readonly val: string;
  // some/noneパターン
  readonly val: SomeReadAuthorName | NoneReadAuthorName;
};

export const createReadAuthorName = (
  authorName: string,
  trip: string | null
): Result<ReadAuthorName, ValidationError> => {
  if (authorName.length > 100) {
    return err(new ValidationError("名前は100文字以内です"));
  }

  if (trip === null || trip === "") {
    return ok({
      _type: "ReadAuthorName",
      val: {
        _type: "none",
        authorName,
      },
    });
  }

  // トリップは8文字になるから流石にこのエラーは出ないと思うけど
  if (trip.length > 100) {
    return err(new ValidationError("トリップは100文字以内です"));
  }

  return ok({
    _type: "ReadAuthorName",
    val: {
      _type: "some",
      authorName,
      trip,
    },
  });
};

export const formatReadAuthorName = (authorName: ReadAuthorName): string => {
  if (authorName.val._type === "none") {
    return authorName.val.authorName;
  }

  return `${authorName.val.authorName}◆${authorName.val.trip}`;
};
