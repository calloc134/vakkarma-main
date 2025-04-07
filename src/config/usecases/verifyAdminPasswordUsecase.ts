import { compare } from "bcrypt-ts";
import { ok, err } from "neverthrow";

import { getPasswordHashRepository } from "../repositories/getPasswordHashRepository";

import type { VakContext } from "../../types/VakContext";

export const verifyAdminPasswordUsecase = async (
  vakContext: VakContext,
  inputPassword: string
) => {
  const { logger } = vakContext;
  
  logger.info({
    operation: "verifyAdminPassword",
    message: "Starting admin password verification"
  });
  
  logger.debug({
    operation: "verifyAdminPassword",
    message: "Fetching stored password hash"
  });
  
  const configResult = await getPasswordHashRepository(vakContext);
  if (configResult.isErr()) {
    logger.error({
      operation: "verifyAdminPassword",
      error: configResult.error,
      message: "Failed to fetch password hash from database"
    });
    return configResult;
  }
  
  const storedPassword = configResult.value;
  
  logger.debug({
    operation: "verifyAdminPassword",
    message: "Comparing input password with stored hash"
  });
  
  if (!(await compare(inputPassword, storedPassword.val))) {
    logger.warn({
      operation: "verifyAdminPassword",
      message: "Invalid password attempt"
    });
    return err(new Error("パスワードが間違っています"));
  }
  
  logger.info({
    operation: "verifyAdminPassword",
    message: "Admin password verified successfully"
  });
  
  return ok(undefined);
};
