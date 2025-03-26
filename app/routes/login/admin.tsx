import { env } from "hono/adapter";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { createRoute } from "honox/factory";

import { ValidationError } from "../../../src/types/Error";
import { verifyAdminPasswordUsecase } from "../../../src/usecases/verifyAdminPasswordUsecase";
import { ErrorMessage } from "../../components/ErrorMessage";
import { sql } from "../../db";

// GET: Render the admin login fors
export default createRoute(async (c) => {
  return c.render(
    <main className="container mx-auto flex-grow py-8 px-4">
      <section className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          パスワード確認
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          パスワードを確認します。
        </h2>
        <form method="post" action="" className="w-full">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="adminPassword"
                className="text-gray-700 text-sm font-bold mb-1"
              >
                パスワード
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
              送信
            </button>
          </div>
        </form>
      </section>
    </main>
  );
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export const POST = createRoute(async (c) => {
  if (!sql) {
    return c.render(
      <ErrorMessage error={new Error("DBに接続できませんでした")} />
    );
  }

  // Get secret key for JWT creation from environment
  const secret =
    env<{ JWT_SECRET_KEY?: string }>(c).JWT_SECRET_KEY ||
    import.meta.env.VITE_JWT_SECRET_KEY;
  if (!secret) {
    return c.render(
      <ErrorMessage error={new Error("JWT_SECRET_KEYが設定されていません。")} />
    );
  }

  const body = await c.req.parseBody();
  const inputPassword = body.adminPassword;
  if (typeof inputPassword !== "string") {
    return c.render(
      <ErrorMessage error={new ValidationError("パスワードがありません")} />
    );
  }

  const result = await verifyAdminPasswordUsecase({ sql }, inputPassword);
  if (result.isErr()) {
    return c.render(<ErrorMessage error={result.error} />);
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60;
  const jwtPayload = { exp };
  const token = await sign(jwtPayload, secret);

  // Set token as an HTTP-only cookie
  setCookie(c, "jwt", token, {
    httpOnly: true,
    maxAge: 60 * 60,
    path: "/admin",
  });
  return c.redirect("/admin", 303);
});
