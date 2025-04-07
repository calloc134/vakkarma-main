import { logger } from "hono/logger";
import { createRoute } from "honox/factory";

import { csrf } from "../middlewares/csrfMiddleware";
import { dbClientMiddlewareConditional } from "../middlewares/dbInitializeMiddleware";

import type { DbClient } from "../middlewares/dbInitializeMiddleware";

export default createRoute(
  logger(),
  csrf(),
  dbClientMiddlewareConditional({
    envKey: "DATABASE_URL",
    contextKey: "sql",
  })
);

declare module "hono" {
  interface ContextVariableMap {
    sql: DbClient;
  }
}
