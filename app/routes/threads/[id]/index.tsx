import { createRoute } from "honox/factory";

import { getAllResponsesByThreadIdUsecase } from "../../../../src/conversation/usecases/getAllResponsesByThreadIdUsecase";
import { ErrorMessage } from "../../../components/ErrorMessage";
import { PaginationLinks } from "../../../components/PaginationLinks";
import { ResponseForm } from "../../../components/ResponseForm";
import { ResponseList } from "../../../components/ResponseList";

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

  // 最新のレス番号を取得
  const latestResponseNumber =
    allResponsesResult.value.responses[
      allResponsesResult.value.responses.length - 1
    ].responseNumber.val;

  const threadTitle = allResponsesResult.value.thread.threadTitle.val;
  const responses = allResponsesResult.value.responses;

  logger.debug({
    operation: "threads/[id]/GET",
    threadId: id,
    threadTitle: threadTitle,
    responseCount: responses.length,
    message: "Successfully fetched thread responses, rendering page",
  });

  return c.render(
    <main className="container mx-auto flex-grow py-8 px-4">
      <section className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-purple-600 font-bold text-xl mb-4">
          {threadTitle} ({responses.length})
        </h3>
        <ResponseList responses={responses} />
      </section>

      <PaginationLinks base={`/threads/${id}`} latest={latestResponseNumber} />

      <ResponseForm action={`/threads/${id}/responses`} />
    </main>
  );
});
