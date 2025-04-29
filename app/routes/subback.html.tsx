import { createRoute } from "honox/factory";

import { getAllThreadsPageUsecase } from "../../src/conversation/usecases/getAllThreadsPageUsecase";
import { ErrorMessage } from "../components/ErrorMessage";
import { ThreadList } from "../components/ThreadList";

export default createRoute(async (c) => {
  const { sql, logger } = c.var;

  logger.info({
    operation: "subback/GET",
    path: c.req.path,
    method: c.req.method,
    message: "Rendering thread list page",
  });

  logger.debug({
    operation: "subback/GET",
    message: "Calling getAllThreadsPageUsecase to retrieve all threads",
  });

  const usecaseResult = await getAllThreadsPageUsecase({
    sql,
    logger,
  });

  if (usecaseResult.isErr()) {
    logger.error({
      operation: "subback/GET",
      error: usecaseResult.error,
      message: "Failed to retrieve all threads",
    });
    return c.render(<ErrorMessage error={usecaseResult.error} />);
  }

  const threads = usecaseResult.value;

  logger.debug({
    operation: "subback/GET",
    threadCount: threads.length,
    message: "Successfully retrieved all threads, rendering page",
  });

  return c.render(
    <main className="container mx-auto flex-grow py-8 px-4">
      <section className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold mb-4">スレッド一覧</h1>
        <p className="mb-4">全部で{threads.length}のスレッドがあります</p>

        <ThreadList threads={threads} />

        <div className="mt-6">
          <a href="/" className="text-blue-600 hover:underline">
            掲示板に戻る
          </a>
        </div>
      </section>
    </main>
  );
});
