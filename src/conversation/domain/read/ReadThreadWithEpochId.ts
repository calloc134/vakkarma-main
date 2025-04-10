import { ok } from "neverthrow";

import type { ReadPostedAt } from "./ReadPostedAt";
import type { ReadThreadEpochId } from "./ReadThreadEpochId";
import type { ReadThreadId } from "./ReadThreadId";
import type { ReadThreadTitle } from "./ReadThreadTitle";
import type { Result } from "neverthrow";

export type ReadThreadWithEpochId = {
  readonly _type: "ReadThreadWithEpochId";
  readonly id: ReadThreadId;
  readonly title: ReadThreadTitle;
  readonly postedAt: ReadPostedAt;
  readonly updatedAt: ReadPostedAt;
  // ここはスレッドのレス数なので妥協
  readonly countResponse: number;
  readonly threadEpochId: ReadThreadEpochId;
};

export const createReadThreadWithEpochId = ({
  id,
  title,
  postedAt,
  updatedAt,
  countResponse,
  threadEpochId,
}: {
  id: ReadThreadId;
  title: ReadThreadTitle;
  postedAt: ReadPostedAt;
  updatedAt: ReadPostedAt;
  countResponse: number;
  threadEpochId: ReadThreadEpochId;
}): Result<ReadThreadWithEpochId, Error> => {
  return ok({
    _type: "ReadThreadWithEpochId",
    id,
    title,
    postedAt,
    updatedAt,
    countResponse,
    threadEpochId,
  });
};
