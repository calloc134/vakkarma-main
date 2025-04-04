import { createRoute } from "honox/factory";

import { jwtAuthMiddleware } from "../../middlewares/jwtCookieMiddleware";

export default createRoute(jwtAuthMiddleware());
