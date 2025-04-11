import { createRoute } from "honox/factory";

import { formatReadAuthorName } from "../../../../src/conversation/domain/read/ReadAuthorName";
import { isSage } from "../../../../src/conversation/domain/write/WriteMail";
import { getAllResponsesByThreadIdUsecase } from "../../../../src/conversation/usecases/getAllResponsesByThreadIdUsecase";
import { formatDate } from "../../../../src/shared/utils/formatDate";
import { ErrorMessage } from "../../../components/ErrorMessage";
import { ResponseContentComponent } from "../../../components/ResponseContent";

export default createRoute(async (c) => {
  const { sql, logger } = c.var;

  logger.info({
    operation: "threads/[id]/GET",
    path: c.req.path,
    method: c.req.method,
    message: "Thread detail page requested",
  });

  if (!sql) {
    logger.error({
      operation: "threads/[id]/GET",
      message: "Database connection not available",
    });
    c.status(500);
    return c.render(
      <ErrorMessage error={new Error("DBに接続できませんでした")} />
    );
  }

  const id = c.req.param("id");

  logger.debug({
    operation: "threads/[id]/GET",
    threadId: id,
    message: "Fetching thread responses",
  });

  const allResponsesResult = await getAllResponsesByThreadIdUsecase(
    { sql, logger },
    { threadIdRaw: id }
  );
  if (allResponsesResult.isErr()) {
    logger.error({
      operation: "threads/[id]/GET",
      error: allResponsesResult.error,
      threadId: id,
      message: "Failed to fetch thread responses",
    });
    c.status(404);
    return c.render(<ErrorMessage error={allResponsesResult.error} />);
  }

  logger.debug({
    operation: "threads/[id]/GET",
    threadId: id,
    threadTitle: allResponsesResult.value.thread.threadTitle.val,
    responseCount: allResponsesResult.value.responses.length,
    message: "Successfully fetched thread responses, rendering page",
  });

  return c.render(
    <main className="container mx-auto flex-grow py-8 px-4">
      <section className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div>
          <h3 className="text-purple-600 font-bold text-xl mb-4">
            {allResponsesResult.value.thread.threadTitle.val} (
            {allResponsesResult.value.responses.length})
          </h3>
          {allResponsesResult.value.responses.map((resp) => {
            return (
              <div
                key={resp.responseNumber.val}
                // スレッドIDとレス番号を組み合わせてアンカーとなるIDを生成
                id={`${resp.threadId.val}-${resp.responseNumber.val}`}
                className="bg-gray-50 p-4 rounded-md"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-bold">{resp.responseNumber.val}</span>
                  <span
                    className={`text-gray-700 ${
                      isSage(resp.mail) ? "text-violet-600" : ""
                    }`}
                  >
                    {formatReadAuthorName(resp.authorName)}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {formatDate(resp.postedAt.val)}
                  </span>
                  <span className="text-gray-500 text-sm">
                    ID: {resp.hashId.val}
                  </span>
                </div>
                <div className="text-gray-800 max-h-80 overflow-y-auto whitespace-pre-wrap">
                  <ResponseContentComponent
                    threadId={resp.threadId}
                    responseContent={resp.responseContent}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">返信する</h2>
        <form
          method="post"
          action={`/threads/${id}/responses`}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <label className="block text-gray-700 text-sm font-bold mb-2 md:w-1/2">
              名前:
              <input
                type="text"
                name="name"
                className="border border-gray-400 rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
              />
            </label>
            <label className="block text-gray-700 text-sm font-bold mb-2 md:w-1/2">
              メールアドレス:
              <input
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
      </section>
    </main>
  );
});
