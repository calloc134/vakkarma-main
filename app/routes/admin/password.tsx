import { createRoute } from "honox/factory";

import { updatePasswordUsecase } from "../../../src/config/usecases/updatePasswordUsecase";
import { ErrorMessage } from "../../components/ErrorMessage";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const POST = createRoute(async (c) => {
  const { sql, logger } = c.var;
  // Check DB connection
  if (!sql) {
    return c.render(
      <ErrorMessage error={new Error("DBに接続できませんでした")} />
    );
  }
  // Parse and validate form fields
  const body = await c.req.parseBody();
  const oldPassword = body.oldPassword;
  const newPassword = body.newPassword;
  const confirmNewPassword = body.confirmNewPassword;
  if (
    typeof oldPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmNewPassword !== "string"
  ) {
    return c.render(
      <ErrorMessage error={new Error("すべての項目を入力してください")} />
    );
  }
  const updateResult = await updatePasswordUsecase(
    { sql, logger },
    { oldPassword, newPassword, confirmNewPassword }
  );
  if (updateResult.isErr()) {
    return c.render(<ErrorMessage error={updateResult.error} />);
  }
  return c.redirect("/admin", 303);
});

export default createRoute(async (c) => {
  // Render password change form
  return c.render(
    <main className="container mx-auto flex-grow py-8 px-4">
      <section className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          パスワード変更
        </h1>
        <form method="post" action="/admin/password" className="w-full">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="oldPassword"
                className="text-gray-700 text-sm font-bold mb-1"
              >
                現在のパスワード
              </label>
              <input
                type="password"
                id="oldPassword"
                name="oldPassword"
                className="border border-gray-400 rounded py-2 px-3 focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="newPassword"
                className="text-gray-700 text-sm font-bold mb-1"
              >
                新しいパスワード
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                className="border border-gray-400 rounded py-2 px-3 focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="confirmNewPassword"
                className="text-gray-700 text-sm font-bold mb-1"
              >
                新しいパスワード（確認）
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                className="border border-gray-400 rounded py-2 px-3 focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              変更
            </button>
          </div>
        </form>
      </section>
    </main>
  );
});
