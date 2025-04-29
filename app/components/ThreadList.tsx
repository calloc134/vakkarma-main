import type { ReadThread } from "../../src/conversation/domain/read/ReadThread";
import type { FC } from "hono/jsx";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const ThreadList: FC<{ threads: ReadThread[] }> = ({ threads }) => (
  <ul className="flex flex-col gap-2">
    {threads.map((thread, index) => (
      <li key={thread.id.val}>
        <a
          className="text-purple-600 hover:underline"
          href={`/threads/${thread.id.val}/l50`}
        >
          {index + 1}: {thread.title.val} ({thread.countResponse})
        </a>
      </li>
    ))}
  </ul>
);
