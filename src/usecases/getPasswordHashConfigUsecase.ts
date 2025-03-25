import { getPasswordHashConfigRepository } from "../repositories/getPasswordHashConfigRepository";

import type { DbContext } from "../types/DbContext";
import type { DatabaseError, DataNotFoundError } from "../types/Error";
import type { Result } from "neverthrow";

export const getPasswordHashConfigUsecase = async (
  dbContext: DbContext
): Promise<Result<string, DatabaseError | DataNotFoundError>> => {
  return await getPasswordHashConfigRepository(dbContext);
};
