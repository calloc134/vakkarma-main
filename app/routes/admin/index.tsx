import { createRoute } from "honox/factory";

import { getNormalConfigUsecase } from "../../../src/config/usecases/getNormalConfigUsecase";
import { updateConfigUsecase } from "../../../src/config/usecases/updateConfigUsecase";
import { ErrorMessage } from "../../components/ErrorMessage";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const POST = createRoute(async (c) => {
  const { sql, logger } = c.var;

  logger.info({
    operation: "admin/POST",
    path: c.req.path,
    method: c.req.method,
    message: "Starting board configuration update",
  });

  if (!sql) {
    logger.error({
      operation: "admin/POST",
      message: "Database connection not available",
    });
    return c.render(
      <ErrorMessage error={new Error("DBに接続できませんでした")} />
    );
  }

  const body = await c.req.parseBody();
  const boardName = body.boardName;
  const localRule = body.localRule;
  const nanashiName = body.nanashiName;
  const maxContentLength = body.maxResponseLength;

  logger.debug({
    operation: "admin/POST",
    hasBoardName: typeof boardName === "string",
    hasLocalRule: typeof localRule === "string",
    hasNanashiName: typeof nanashiName === "string",
    hasMaxContentLength: typeof maxContentLength === "string",
    message: "Request body parsed for configuration update",
  });

  if (
    typeof boardName !== "string" ||
    typeof localRule !== "string" ||
    typeof nanashiName !== "string" ||
    typeof maxContentLength !== "string"
  ) {
    logger.warn({
      operation: "admin/POST",
      validationError: "Missing required fields",
      hasBoardName: typeof boardName === "string",
      hasLocalRule: typeof localRule === "string",
      hasNanashiName: typeof nanashiName === "string",
      hasMaxContentLength: typeof maxContentLength === "string",
      message:
        "Configuration update validation failed - missing required fields",
    });
    return c.render(
      <ErrorMessage error={new Error("すべての項目を入力してください")} />
    );
  }

  logger.debug({
    operation: "admin/POST",
    boardName,
    localRule,
    nanashiName,
    maxContentLength,
    message: "Calling updateConfigUsecase",
  });

  const updateConfigResult = await updateConfigUsecase(
    { sql, logger },
    {
      boardNameRaw: boardName,
      localRuleRaw: localRule,
      defaultAuthorNameRaw: nanashiName,
      maxContentLengthRaw: Number(maxContentLength),
    }
  );
  if (updateConfigResult.isErr()) {
    logger.error({
      operation: "admin/POST",
      error: updateConfigResult.error,
      message: "Configuration update failed",
    });
    return c.render(<ErrorMessage error={updateConfigResult.error} />);
  }

  logger.info({
    operation: "admin/POST",
    boardName,
    nanashiName,
    maxContentLength,
    message: "Configuration updated successfully, redirecting to admin page",
  });

  return c.redirect("/admin", 303);
});

export default createRoute(async (c) => {
  const { sql, logger } = c.var;

  logger.info({
    operation: "admin/GET",
    path: c.req.path,
    method: c.req.method,
    message: "Admin configuration page requested",
  });

  // 管理者画面 config関連
  if (!sql) {
    logger.error({
      operation: "admin/GET",
      message: "Database connection not available",
    });
    return c.render(
      <ErrorMessage error={new Error("DBに接続できませんでした")} />
    );
  }

  logger.debug({
    operation: "admin/GET",
    message: "Fetching configuration data",
  });

  const configResult = await getNormalConfigUsecase({ sql, logger });
  if (configResult.isErr()) {
    logger.error({
      operation: "admin/GET",
      error: configResult.error,
      message: "Failed to retrieve configuration data",
    });
    return c.render(<ErrorMessage error={configResult.error} />);
  }

  logger.debug({
    operation: "admin/GET",
    boardName: configResult.value.boardName.val,
    message: "Configuration data retrieved successfully, rendering admin page",
  });

  // フォームの形にする
  return c.render(
    <main className="container mx-auto flex-grow py-8 px-4">
      <section className="bg-white rounded-lg shadow-md p-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">管理者画面</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">設定</h2>
        <form method="post" action="/admin" className="w-full">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="boardName"
                className="text-gray-700 text-sm font-bold mb-1"
              >
                掲示板名
              </label>
              <input
                type="text"
                id="boardName"
                name="boardName"
                value={configResult.value.boardName.val}
                className="border border-gray-400 rounded py-2 px-3 focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="localRule"
                className="text-gray-700 text-sm font-bold mb-1"
              >
                ルール
              </label>
              <input
                type="text"
                id="localRule"
                name="localRule"
                value={configResult.value.localRule.val}
                className="border border-gray-400 rounded py-2 px-3 focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="nanashiName"
                className="text-gray-700 text-sm font-bold mb-1"
              >
                デフォルト名
              </label>
              <input
                type="text"
                id="nanashiName"
                name="nanashiName"
                value={configResult.value.defaultAuthorName.val}
                className="border border-gray-400 rounded py-2 px-3 focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="maxResponseLength"
                className="text-gray-700 text-sm font-bold mb-1"
              >
                最大文字数
              </label>
              <input
                type="number"
                id="maxResponseLength"
                name="maxResponseLength"
                value={configResult.value.maxContentLength.val}
                className="border border-gray-400 rounded py-2 px-3 focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="w-60 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              更新
            </button>
          </div>
          <div className="mt-4 flex justify-end">
            <a href="/admin/password" className="text-blue-500 underline">
              パスワード変更
            </a>
          </div>
        </form>
      </section>
    </main>
  );
});
