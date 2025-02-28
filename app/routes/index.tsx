import { createRoute } from "honox/factory";

import { formatReadAuthorName } from "../../src/domain/value_object/ReadAuthorName";
import { getTopPageUsecase } from "../../src/usecases/getTopPageUsecase";
import { formatDate } from "../../src/utils/formatDate";
import { ErrorMessage } from "../components/ErrorMessage";
import { ResponseContentComponent } from "../components/ResponseContent";
import { sql } from "../db";

export default createRoute(async (c) => {
  if (!sql) {
    return c.render(
      <ErrorMessage error={new Error("DBに接続できませんでした")} />
    );
  }
  const usecaseResult = await getTopPageUsecase({
    sql,
  });

  if (usecaseResult.isErr()) {
    return c.render(<ErrorMessage error={usecaseResult.error} />);
  }

  const { threadTop30, responsesTop10 } = usecaseResult.value;

  return c.render(
    <main className="container mx-auto flex-grow py-8 px-4">
      <section className="bg-white rounded-lg shadow-md p-6 mb-8">
        <ul className="flex flex-col gap-2">
          {threadTop30.map((thread, index) => (
            <li key={thread.threadId.val} className="">
              <a
                className="text-purple-600 underline"
                href={`/threads/${thread.threadId.val}`}
              >
                {index + 1}: {thread.title.val} ({thread.countResponse})
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <ul className="flex flex-col gap-4">
          {responsesTop10.map((threadResp, threadIndex) => (
            <li
              key={threadResp.thread.threadId.val}
              className="bg-white rounded-lg shadow-md p-6 pb-4"
            >
              <h3 className="text-purple-600 font-bold text-xl">
                【{threadIndex + 1}:{threadResp.thread.countResponse}】{" "}
                {threadResp.thread.title.val}
              </h3>
              <ul className="flex flex-col gap-2 mt-2">
                {threadResp.responses.map((resp) => (
                  <li
                    key={resp.responseId.val}
                    id={`${resp.threadId.val}-${resp.responseNumber.val}`}
                    className="bg-gray-50 p-4 rounded-md"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-bold">
                        {resp.responseNumber.val}
                      </span>
                      <span className="text-gray-700">
                        名前: {formatReadAuthorName(resp.authorName)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {formatDate(resp.postedAt.val)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ID: {resp.hashId.val}
                      </span>
                    </div>
                    <p className="text-gray-800">
                      <ResponseContentComponent
                        threadId={resp.threadId}
                        responseContent={resp.responseContent}
                      />
                    </p>
                  </li>
                ))}
              </ul>
              <div className="m-4 p-2 rounded-md">
                <h3 className="text-xl font-semibold mb-4">返信する</h3>
                <form
                  method="post"
                  action={`/threads/${threadResp.thread.threadId.val}/responses`}
                  className="flex flex-col gap-4"
                >
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      名前:
                      <input
                        type="text"
                        name="name"
                        className="border border-gray-400 rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      メールアドレス:
                      <input
                        type="email"
                        name="mail"
                        className="border border-gray-400 rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      本文:
                      <textarea
                        name="content"
                        required
                        className="border border-gray-400 rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline h-32"
                      ></textarea>
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    書き込む
                  </button>
                </form>
                <a
                  href={`/threads/${threadResp.thread.threadId.val}`}
                  className="text-blue-600 hover:underline"
                >
                  全部読む
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">新規スレッド作成</h2>
        <form method="post" action="/threads" className="flex flex-col gap-2">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              スレッドタイトル:
              <input
                type="text"
                name="title"
                required
                className="border border-gray-400 rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
              />
            </label>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              名前:
              <input
                type="text"
                name="name"
                className="border border-gray-400 rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
              />
            </label>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              メールアドレス:
              <input
                type="email"
                name="mail"
                className="border border-gray-400 rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
              />
            </label>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              本文:
              <textarea
                name="content"
                required
                className="border border-gray-400 rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline h-32"
              ></textarea>
            </label>
          </div>
          <button
            type="submit"
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            新規スレッド作成
          </button>
        </form>
      </section>
    </main>
  );
});
