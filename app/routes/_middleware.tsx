import { logger } from "hono/logger";
import { pinoLogger, type PinoLogger } from "hono-pino";
import { createRoute } from "honox/factory";

import { csrf } from "../middlewares/csrfMiddleware";
import {
  dbClientMiddlewareConditional,
  type DbClient,
} from "../middlewares/dbInitializeMiddleware";

export default createRoute(
  pinoLogger({
    pino: {
      level: "warn",
    },
  }),
  logger(),
  csrf(),
  dbClientMiddlewareConditional({
    envKey: "DATABASE_URL",
    contextKey: "sql",
  })
);

declare module "hono" {
  interface ContextVariableMap {
    logger: PinoLogger;
    sql: DbClient;
  }
}
