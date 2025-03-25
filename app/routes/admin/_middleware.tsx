import { createRoute } from "honox/factory";

import { jwtCookieMiddleware } from "../../jwtCookieMiddleware";

export default createRoute(jwtCookieMiddleware());
