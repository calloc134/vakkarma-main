import { err, ok, type Result } from "neverthrow";
import postgres from "postgres";

import { DatabaseError } from "../src/types/Error";

import type { Sql } from "postgres";

export let sql: Sql | null = null;

export const initSql = (
  databaseUrl: string
): Result<undefined, DatabaseError> => {
  try {
    sql = postgres(databaseUrl);
    return ok(undefined);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return err(new DatabaseError(message));
  }
};
