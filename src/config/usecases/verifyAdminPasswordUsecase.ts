import { compare } from "bcrypt-ts";
import { ok, err } from "neverthrow";

import { getPasswordHashRepository } from "../repositories/getPasswordHashRepository";

import type { VakContext } from "../../types/VakContext";

export const verifyAdminPasswordUsecase = async (
  dbContext: VakContext,
  inputPassword: string
) => {
  const configResult = await getPasswordHashRepository(dbContext);
  if (configResult.isErr()) {
    return configResult;
  }
  const storedPassword = configResult.value;
  if (!(await compare(inputPassword, storedPassword.val))) {
    return err(new Error("パスワードが間違っています"));
  }
  return ok(undefined);
};
