import { env } from "hono/adapter";
import { setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { sign } from "hono/jwt";

export const jwtCookieMiddleware = () => {
  return createMiddleware(async (c, next) => {
    // JWTの有効期限を1時間に設定
    const exp = Math.floor(Date.now() / 1000) + 60 * 60;

    const secret =
      env<{ JWT_SECRET_KEY: string | undefined }>(c).JWT_SECRET_KEY ||
      import.meta.env.VITE_JWT_SECRET_KEY;

    const payload = {};

    // payloadにexpを追加
    const jwtPayload = {
      ...payload,
      exp,
    };
    const token = await sign(jwtPayload, secret);

    setCookie(c, "jwt", token, {
      httpOnly: true,
      maxAge: 60 * 60,
      path: "/admin",
      // secure: true,
    });

    await next();
  });
};
