import type { PinoLogger } from "hono-pino";
import type { Sql } from "postgres";

export type VakContext = {
  sql: Sql;
  logger: PinoLogger;
};
