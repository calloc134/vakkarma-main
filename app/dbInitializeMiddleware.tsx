import { env, getRuntimeKey } from "hono/adapter";
import { createMiddleware } from "hono/factory";

import { sql, initSql } from "./db";

export const dbInitializeMiddleware = createMiddleware(async (c, next) => {
  const isCloudflareWorkers = getRuntimeKey() === "workerd";

  // Cloudflare Workersの場合は毎回DBに接続する
  // それ以外でもsqlがnullの場合はDBに接続する
  if (isCloudflareWorkers || !sql) {
    // 本番環境と開発環境に対応
    const databaseUrl =
      // 本番環境の場合
      env<{ DATABASE_URL: string | undefined }>(c).DATABASE_URL ||
      // 開発環境の場合
      // prettier-ignore
      `postgresql://${import.meta.env.VITE_POSTGRES_USER}:${import.meta.env.VITE_POSTGRES_PASSWORD}@localhost:5432/${import.meta.env.VITE_POSTGRES_DB}?sslmode=disable`;

    console.log("databaseUrl", databaseUrl);

    const max = isCloudflareWorkers ? 1 : 10;

    const result = initSql(databaseUrl, max);
    if (result.isErr()) {
      return c.render(
        <div>DBに接続できませんでした。管理者にお問い合わせください。</div>
      );
    }
  }
  await next();
});
