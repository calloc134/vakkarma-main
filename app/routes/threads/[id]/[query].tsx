import { createRoute } from "honox/factory";

import { getAllResponsesByThreadIdUsecase } from "../../../../src/conversation/usecases/getAllResponsesByThreadIdUsecase";
import { getLatestResponsesByThreadIdAndCountUsecase } from "../../../../src/conversation/usecases/getLatestResponsesByThreadIdAndCountUsecase";
import { getResponseByThreadIdAndResNumRangeUsecase } from "../../../../src/conversation/usecases/getResponseByThreadIdAndResNumRangeUsecase";
import { getResponseByThreadIdAndResNumUsecase } from "../../../../src/conversation/usecases/getResponseByThreadIdAndResNumUsecase";
import { ErrorMessage } from "../../../components/ErrorMessage";
import { PaginationLinks } from "../../../components/PaginationLinks";
import { ResponseForm } from "../../../components/ResponseForm";
import { ResponseList } from "../../../components/ResponseList";

import type { ReadThreadWithResponses } from "../../../../src/conversation/domain/read/ReadThreadWithResponses";
import type { Result } from "neverthrow";

export default createRoute(async (c) => {
  const { sql, logger } = c.var;

  logger.info({
    operation: "threads/[id]/[query]/GET",
    path: c.req.path,
    method: c.req.method,
    message: "Thread query page requested",
  });

  if (!sql) {
    logger.error({
      operation: "threads/[id]/[query]/GET",
      message: "Database connection not available",
    });
    c.status(500);
    return c.render(
      <ErrorMessage error={new Error("DBに接続できませんでした")} />
    );
  }

  const id = c.req.param("id");
  const queryString = c.req.param("query");

  logger.debug({
    operation: "threads/[id]/[query]/GET",
    threadId: id,
    query: queryString,
    message: "Parsing query string and fetching responses",
  });

  let responsesResult: Result<ReadThreadWithResponses, Error>;

  // パターン別の処理
  // 1. l50 - 最新50件
  if (queryString.startsWith("l") && /^l\d+$/.test(queryString)) {
    const count = parseInt(queryString.substring(1), 10);
    logger.debug({
      operation: "threads/[id]/[query]/GET",
      threadId: id,
      query: queryString,
      count,
      message: "Fetching latest responses",
    });

    responsesResult = await getLatestResponsesByThreadIdAndCountUsecase(
      { sql, logger },
      { threadIdRaw: id, countRaw: count }
    );
  }
  // 2. 数値のみ - 特定のレス番号を取得
  else if (/^\d+$/.test(queryString)) {
    const resNum = parseInt(queryString, 10);
    logger.debug({
      operation: "threads/[id]/[query]/GET",
      threadId: id,
      query: queryString,
      responseNumber: resNum,
      message: "Fetching specific response",
    });

    responsesResult = await getResponseByThreadIdAndResNumUsecase(
      { sql, logger },
      { threadIdRaw: id, responseNumberRaw: resNum }
    );
  }
  // 3. 範囲指定 (XX-, -YY, XX-YY)
  else if (/^\d*-\d*$/.test(queryString)) {
    const [startStr, endStr] = queryString.split("-");
    const start = startStr ? parseInt(startStr, 10) : null;
    const end = endStr ? parseInt(endStr, 10) : null;

    logger.debug({
      operation: "threads/[id]/[query]/GET",
      threadId: id,
      query: queryString,
      startResponse: start,
      endResponse: end,
      message: "Fetching response range",
    });

    responsesResult = await getResponseByThreadIdAndResNumRangeUsecase(
      { sql, logger },
      {
        threadIdRaw: id,
        startResponseNumberRaw: start,
        endResponseNumberRaw: end,
      }
    );
  }
  // 4. 空文字列またはその他 - 全レスを取得
  else {
    logger.debug({
      operation: "threads/[id]/[query]/GET",
      threadId: id,
      query: queryString,
      message: "Query format not recognized or empty, fetching all responses",
    });

    responsesResult = await getAllResponsesByThreadIdUsecase(
      { sql, logger },
      { threadIdRaw: id }
    );
  }

  if (responsesResult.isErr()) {
    logger.error({
      operation: "threads/[id]/[query]/GET",
      error: responsesResult.error,
      threadId: id,
      query: queryString,
      message: "Failed to fetch thread responses",
    });
    c.status(404);
    return c.render(<ErrorMessage error={responsesResult.error} />);
  }

  // 最新のレス番号を取得
  const latestResponseNumber =
    responsesResult.value.responses[responsesResult.value.responses.length - 1]
      .responseNumber.val;

  logger.debug({
    operation: "threads/[id]/[query]/GET",
    threadId: id,
    query: queryString,
    threadTitle: responsesResult.value.thread.threadTitle.val,
    responseCount: responsesResult.value.responses.length,
    message: "Successfully fetched thread responses, rendering page",
  });

  return c.render(
    <main className="container mx-auto flex-grow py-8 px-4">
      <ResponseList responses={responsesResult.value.responses} />
      <PaginationLinks base={`/threads/${id}`} latest={latestResponseNumber} />
      <ResponseForm action={`/threads/${id}/responses`} />
    </main>
  );
});
