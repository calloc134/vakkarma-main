import { logger } from "hono/logger";
import { createRoute } from "honox/factory";

import { csrf } from "../csrf";
import { dbInitializeMiddleware } from "../dbInitializeMiddleware";

export default createRoute(
  logger(),

  csrf({}),
  dbInitializeMiddleware()
);
