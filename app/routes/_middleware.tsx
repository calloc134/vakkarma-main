import { logger } from "hono/logger";
import { createRoute } from "honox/factory";

import { csrf } from "../middlewares/csrfMiddleware";
import { dbInitializeMiddleware } from "../middlewares/dbInitializeMiddleware";

export default createRoute(logger(), csrf(), dbInitializeMiddleware());
