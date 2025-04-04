import { env } from "hono/adapter";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

import { ErrorMessage } from "../components/ErrorMessage";

export const jwtAuthMiddleware = () => {
  return createMiddleware(async (c, next) => {
    const secret =
      env<{ JWT_SECRET_KEY: string | undefined }>(c).JWT_SECRET_KEY ||
      import.meta.env.VITE_JWT_SECRET_KEY;

    if (!secret) {
      return c.render(
        <ErrorMessage
          error={new Error("JWT_SECRET_KEYが設定されていません。")}
        />
      );
    }

    const token = getCookie(c, "jwt");

    if (!token) {
      return c.redirect("/login/admin", 302);
    }

    try {
      await verify(token, secret); // JWTを検証
      // payload を context に保存するなど、後続の処理で利用できるようにする
      // 必要ないのでコメントアウト
      // c.set("jwtPayload", payload);
      await next();
    } catch {
      return c.redirect("/login/admin", 302);
    }
  });
};
