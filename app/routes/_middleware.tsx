import { csrf } from "hono/csrf";
import { logger } from "hono/logger";
import { createRoute } from "honox/factory";

import { dbInitializeMiddleware } from "../dbInitializeMiddleware";

export default createRoute(logger(), csrf(), dbInitializeMiddleware);
