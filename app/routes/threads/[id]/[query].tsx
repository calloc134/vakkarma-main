import { createRoute } from "honox/factory";

import { formatReadAuthorName } from "../../../../src/conversation/domain/read/ReadAuthorName";
import { isSage } from "../../../../src/conversation/domain/write/WriteMail";
import { getAllResponsesByThreadIdUsecase } from "../../../../src/conversation/usecases/getAllResponsesByThreadIdUsecase";
import { getLatestResponsesByThreadIdAndCountUsecase } from "../../../../src/conversation/usecases/getLatestResponsesByThreadIdAndCountUsecase";
import { getResponseByThreadIdAndResNumRangeUsecase } from "../../../../src/conversation/usecases/getResponseByThreadIdAndResNumRangeUsecase";
import { getResponseByThreadIdAndResNumUsecase } from "../../../../src/conversation/usecases/getResponseByThreadIdAndResNumUsecase";
import { formatDate } from "../../../../src/shared/utils/formatDate";
import { ErrorMessage } from "../../../components/ErrorMessage";
import { ResponseContentComponent } from "../../../components/ResponseContent";
import FormEnhance from "../../../islands/FormEnhance";

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
    responseCount: responsesResult.value.thread.responseCount,
    message: "Successfully fetched thread responses, rendering page",
  });

  return c.render(
    <main className="container mx-auto flex-grow py-8 px-4">
      <section className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div>
          <h3 className="text-purple-600 font-bold text-xl mb-4">
            {responsesResult.value.thread.threadTitle.val} (
            {responsesResult.value.thread.responseCount}件)
          </h3>
          {responsesResult.value.responses.map((resp) => {
            return (
              <div
                key={resp.responseNumber.val}
                id={`${resp.threadId.val}-${resp.responseNumber.val}`}
                className="bg-gray-50 p-4 rounded-md mb-2"
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
                    {formatDate(resp.postedAt.val, {
                      acceptLanguage:
                        c.req.header("Accept-Language") ?? undefined,
                    })}
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
        <div className="flex gap-4 mt-2">
          <a
            href={`/threads/${responsesResult.value.thread.threadId.val}`}
            className="text-blue-600 hover:underline"
          >
            全部読む
          </a>
          <a
            href={`/threads/${responsesResult.value.thread.threadId.val}/l50`}
            className="text-blue-600 hover:underline"
          >
            最新50件
          </a>
          <a
            href={`/threads/${responsesResult.value.thread.threadId.val}/1-100`}
            className="text-blue-600 hover:underline"
          >
            1-100
          </a>
          <a
            href={`/threads/${responsesResult.value.thread.threadId.val}/${latestResponseNumber}-`}
            className="text-blue-600 hover:underline"
          >
            新着レスの表示
          </a>
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
          {/* Add the FormEnhance island */}
          <FormEnhance />
        </form>
      </section>
    </main>
  );
});
