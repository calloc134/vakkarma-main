import type { Sql } from "postgres";

export type DbContext = {
  sql: Sql;
};
