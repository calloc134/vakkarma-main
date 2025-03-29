import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../../types/Error";
import { createTrip } from "../../../utils/createTrip";

import type { ReadAuthorName } from "../read/ReadAuthorName";

type SomeWriteAuthorName = {
  readonly _type: "some";
  readonly authorName: string;
  readonly trip: string;
};

type NoneWriteAuthorName = {
  readonly _type: "none";
  readonly authorName: string;
};

// 投稿者名
export type WriteAuthorName = {
  readonly _type: "WriteAuthorName";
  // readonly val: string;
  // some/noneパターン
  readonly val: SomeWriteAuthorName | NoneWriteAuthorName;
};

export const createWriteAuthorName = async (
  authorName: string | null,
  // 高階関数パターンで、より低レイヤの処理を隠蔽できるようにする
  getNanashiName: () => Promise<Result<ReadAuthorName, Error>>
): Promise<Result<WriteAuthorName, ValidationError>> => {
  if (!authorName) {
    const nanashiName = await getNanashiName();
    if (nanashiName.isErr()) {
      return err(nanashiName.error);
    }
    return ok({
      _type: "WriteAuthorName",
      val: {
        _type: "none",
        authorName: nanashiName.value.val.authorName,
      },
    });
  }

  if (authorName.length > 100) {
    return err(new ValidationError("名前は100文字以内です"));
  }

  if (authorName.includes("#")) {
    const [name, tripKey] = authorName.split("#");
    const trip = createTrip(tripKey);
    return ok({
      _type: "WriteAuthorName",
      val: {
        _type: "some",
        authorName: name,
        trip: trip,
      },
    });
  }

  return ok({
    _type: "WriteAuthorName",
    val: {
      _type: "none",
      authorName,
    },
  });
};
