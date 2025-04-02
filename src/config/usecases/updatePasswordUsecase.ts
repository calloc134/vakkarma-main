import { compare } from "bcrypt-ts";
import { ok, err, type Result } from "neverthrow";

import {
  createPassword,
  generatePasswordHash,
} from "../../domain/value_object/WritePassword";
import { getPasswordHashConfigRepository } from "../../repositories/getPasswordHashConfigRepository";
import { updatePasswordRepository } from "../../repositories/updatePasswordRepository";
import { ValidationError } from "../../types/Error";

import type { DbContext } from "../../types/DbContext";

export const updatePasswordUsecase = async (
  dbContext: DbContext,
  {
    oldPassword,
    newPassword,
    confirmNewPassword,
  }: { oldPassword: string; newPassword: string; confirmNewPassword: string }
): Promise<Result<undefined, Error>> => {
  if (newPassword !== confirmNewPassword) {
    return err(
      new ValidationError("新しいパスワードと確認パスワードが一致しません")
    );
  }

  const storedHashResult = await getPasswordHashConfigRepository(dbContext);
  if (storedHashResult.isErr()) {
    return err(storedHashResult.error);
  }
  const storedHash = storedHashResult.value;

  const passwordMatch = await compare(oldPassword, storedHash);
  if (!passwordMatch) {
    return err(new ValidationError("現在のパスワードが正しくありません"));
  }

  const newPasswordResult = createPassword(newPassword);
  if (newPasswordResult.isErr()) {
    return err(newPasswordResult.error);
  }

  const newHashResult = await generatePasswordHash(newPasswordResult.value);
  if (newHashResult.isErr()) {
    return err(newHashResult.error);
  }

  const updateResult = await updatePasswordRepository(
    dbContext,
    newHashResult.value
  );
  if (updateResult.isErr()) {
    return err(updateResult.error);
  }

  return ok(undefined);
};
