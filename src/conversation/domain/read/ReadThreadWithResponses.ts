import { ok } from "neverthrow";

import type { ReadResponse } from "./ReadResponse";
import type { ReadThreadId } from "./ReadThreadId";
import type { ReadThreadTitle } from "./ReadThreadTitle";
import type { Result } from "neverthrow";

export type ReadThreadWithResponses = {
  _type: "ReadThreadWithResponses";
  thread: { threadId: ReadThreadId; threadTitle: ReadThreadTitle };
  responses: ReadResponse[];
};

export const createReadThreadWithResponses = (
  threadId: ReadThreadId,
  threadTitle: ReadThreadTitle,
  responses: ReadResponse[]
): Result<ReadThreadWithResponses, never> => {
  return ok({
    _type: "ReadThreadWithResponses",
    thread: { threadId, threadTitle },
    responses,
  });
};
