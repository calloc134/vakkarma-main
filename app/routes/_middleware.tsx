import { logger } from "hono/logger";
import { pinoLogger } from "hono-pino";
import { createRoute } from "honox/factory";

import { csrf } from "../middlewares/csrfMiddleware";
import { dbInitializeMiddleware } from "../middlewares/dbInitializeMiddleware";

import type { PinoLogger } from "hono-pino";

export default createRoute(
  pinoLogger(),
  logger(),
  csrf(),
  dbInitializeMiddleware()
);

// しょうがないので型定義を拡張
declare module "hono" {
  interface ContextVariableMap {
    logger: PinoLogger;
  }
}
