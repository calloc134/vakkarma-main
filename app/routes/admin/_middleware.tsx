import { createRoute } from "honox/factory";

import { jwtAuthMiddleware } from "../../jwtCookieMiddleware";

export default createRoute(jwtAuthMiddleware());
