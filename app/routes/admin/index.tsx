import { createRoute } from "honox/factory";

import { getConfigUsecase } from "../../../src/usecases/getConfigUsecase";
import { updateConfigUsecase } from "../../../src/usecases/updateConfigUsecase";
import { ErrorMessage } from "../../components/ErrorMessage";
import { sql } from "../../db";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const POST = createRoute(async (c) => {
  if (!sql) {
    return c.render(
      <ErrorMessage error={new Error("DBに接続できませんでした")} />
    );
  }
  const body = await c.req.parseBody();
  const boardName = body.boardName;
  const localRule = body.localRule;
  const nanashiName = body.nanashiName;
  const maxContentLength = body.maxResponseLength;
  const adminPassword = body.adminPassword;

  if (
    typeof boardName !== "string" ||
    typeof localRule !== "string" ||
    typeof nanashiName !== "string" ||
    typeof maxContentLength !== "string" ||
    typeof adminPassword !== "string"
  ) {
    return c.render(
      <ErrorMessage error={new Error("すべての項目を入力してください")} />
    );
  }
  const updateConfigResult = await updateConfigUsecase(
    { sql },
    {
      boardNameRaw: boardName,
      localRuleRaw: localRule,
      nanashiNameRaw: nanashiName,
      maxContentLengthRaw: Number(maxContentLength),
      inputPasswordRaw: adminPassword,
    }
  );
  if (updateConfigResult.isErr()) {
    return c.render(<ErrorMessage error={updateConfigResult.error} />);
  }
  return c.redirect("/admin", 303);
});

export default createRoute(async (c) => {
  // 管理者画面 config関連
  if (!sql) {
    return c.render(
      <ErrorMessage error={new Error("DBに接続できませんでした")} />
    );
  }
  const configResult = await getConfigUsecase({ sql });
  if (configResult.isErr()) {
    return c.render(<ErrorMessage error={configResult.error} />);
  }
  // フォームの形にする
  return c.render(
    <main className="container mx-auto flex-grow py-8 px-4">
      <section className="bg-white rounded-lg shadow-md p-6">
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
                value={configResult.value.boardName}
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
                value={configResult.value.localRule}
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
                value={configResult.value.nanashiName}
                className="border border-gray-400 rounded py-2 px-3 focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="maxResponseLength"
                className="text-gray-700 text-sm font-bold mb-1"
              >
                最大文字数 (現在実装中)
              </label>
              <input
                type="number"
                id="maxResponseLength"
                name="maxResponseLength"
                value={configResult.value.maxContentLength}
                className="border border-gray-400 rounded py-2 px-3 focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="adminPassword"
                className="text-gray-700 text-sm font-bold mb-1"
              >
                管理者パスワード
              </label>
              <input
                type="password"
                id="adminPassword"
                name="adminPassword"
                className="border border-gray-400 rounded py-2 px-3 focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              更新
            </button>
          </div>
        </form>
      </section>
    </main>
  );
});
