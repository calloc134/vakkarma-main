import { compare } from "bcrypt-ts";
import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../shared/types/Error";
import { createWritePassword } from "../domain/write/WritePassword";
import { generateWritePasswordHash } from "../domain/write/WritePasswordHash";
import { getPasswordHashRepository } from "../repositories/getPasswordHashRepository";
import { updatePasswordHashRepository } from "../repositories/updatePasswordHashRepository";

import type { VakContext } from "../../shared/types/VakContext";

export const updatePasswordUsecase = async (
  vakContext: VakContext,
  {
    oldPassword,
    newPassword,
    confirmNewPassword,
  }: { oldPassword: string; newPassword: string; confirmNewPassword: string }
): Promise<Result<undefined, Error>> => {
  const { logger } = vakContext;

  logger.info({
    operation: "updatePassword",
    message: "Starting password update process",
  });

  if (newPassword !== confirmNewPassword) {
    logger.warn({
      operation: "updatePassword",
      message:
        "Password update failed: new password and confirmation do not match",
    });
    return err(
      new ValidationError("新しいパスワードと確認パスワードが一致しません")
    );
  }

  logger.debug({
    operation: "updatePassword",
    message: "Fetching stored password hash",
  });

  const storedHashResult = await getPasswordHashRepository(vakContext);
  if (storedHashResult.isErr()) {
    logger.error({
      operation: "updatePassword",
      error: storedHashResult.error,
      message: "Failed to fetch stored password hash",
    });
    return err(storedHashResult.error);
  }
  const storedHash = storedHashResult.value;

  logger.debug({
    operation: "updatePassword",
    message: "Verifying current password",
  });

  const passwordMatch = await compare(oldPassword, storedHash.val);
  if (!passwordMatch) {
    logger.warn({
      operation: "updatePassword",
      message: "Password update failed: current password is incorrect",
    });
    return err(new ValidationError("現在のパスワードが正しくありません"));
  }

  logger.debug({
    operation: "updatePassword",
    message: "Validating new password format",
  });

  const newPasswordResult = await createWritePassword(newPassword);
  if (newPasswordResult.isErr()) {
    logger.error({
      operation: "updatePassword",
      error: newPasswordResult.error,
      message: "Failed to validate new password format",
    });
    return err(newPasswordResult.error);
  }

  logger.debug({
    operation: "updatePassword",
    message: "Generating hash for new password",
  });

  const newHashResult = await generateWritePasswordHash(
    newPasswordResult.value
  );
  if (newHashResult.isErr()) {
    logger.error({
      operation: "updatePassword",
      error: newHashResult.error,
      message: "Failed to generate hash for new password",
    });
    return err(newHashResult.error);
  }

  logger.debug({
    operation: "updatePassword",
    message: "Updating password hash in database",
  });

  const updateResult = await updatePasswordHashRepository(
    vakContext,
    newHashResult.value
  );
  if (updateResult.isErr()) {
    logger.error({
      operation: "updatePassword",
      error: updateResult.error,
      message: "Failed to update password hash in database",
    });
    return err(updateResult.error);
  }

  logger.info({
    operation: "updatePassword",
    message: "Password updated successfully",
  });

  return ok(undefined);
};
