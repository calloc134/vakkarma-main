import { compare } from "bcrypt-ts";
import { ok, err } from "neverthrow";

import { getPasswordHashConfigRepository } from "../../repositories/getPasswordHashConfigRepository";

import type { DbContext } from "../../types/DbContext";

export const verifyAdminPasswordUsecase = async (
  dbContext: DbContext,
  inputPassword: string
) => {
  const configResult = await getPasswordHashConfigRepository(dbContext);
  if (configResult.isErr()) {
    return configResult;
  }
  const storedPassword = configResult.value;
  if (!(await compare(inputPassword, storedPassword))) {
    return err(new Error("パスワードが間違っています"));
  }
  return ok(undefined);
};
