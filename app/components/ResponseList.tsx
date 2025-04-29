import { formatReadAuthorName } from "../../src/conversation/domain/read/ReadAuthorName";
import { isSage } from "../../src/conversation/domain/write/WriteMail";
import { formatDate } from "../../src/shared/utils/formatDate";

import { ResponseContentComponent } from "./ResponseContent";

import type { ReadResponseSummary } from "../../src/conversation/domain/read/ReadResponseSummary";
import type { FC } from "hono/jsx";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ResponseList: FC<{ responses: ReadResponseSummary[] }> = ({
  responses,
}) => (
  <>
    {responses.map((r) => (
      <div
        key={r.responseNumber.val}
        id={`${r.threadId.val}-${r.responseNumber.val}`}
        className="bg-gray-50 p-4 rounded-md mb-2"
      >
        <div className="flex gap-2 mb-1">
          <span className="font-bold">{r.responseNumber.val}</span>
          <span className={isSage(r.mail) ? "text-violet-600" : ""}>
            {formatReadAuthorName(r.authorName)}
          </span>
          <span className="text-sm text-gray-500">
            {formatDate(r.postedAt.val)}
          </span>
        </div>
        <ResponseContentComponent
          threadId={r.threadId}
          responseContent={r.responseContent}
        />
      </div>
    ))}
  </>
);
