import { compare } from "bcrypt-ts";
import { ok, err, type Result } from "neverthrow";

import { ValidationError } from "../../types/Error";
import { createWritePassword } from "../domain/write/WritePassword";
import { generateWritePasswordHash } from "../domain/write/WritePasswordHash";
import { getPasswordHashRepository } from "../repositories/getPasswordHashRepository";
import { updatePasswordHashRepository } from "../repositories/updatePasswordHashRepository";

import type { VakContext } from "../../types/VakContext";

export const updatePasswordUsecase = async (
  dbContext: VakContext,
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

  const storedHashResult = await getPasswordHashRepository(dbContext);
  if (storedHashResult.isErr()) {
    return err(storedHashResult.error);
  }
  const storedHash = storedHashResult.value;

  const passwordMatch = await compare(oldPassword, storedHash.val);
  if (!passwordMatch) {
    return err(new ValidationError("現在のパスワードが正しくありません"));
  }

  const newPasswordResult = await createWritePassword(newPassword);
  if (newPasswordResult.isErr()) {
    return err(newPasswordResult.error);
  }

  const newHashResult = await generateWritePasswordHash(
    newPasswordResult.value
  );
  if (newHashResult.isErr()) {
    return err(newHashResult.error);
  }

  const updateResult = await updatePasswordHashRepository(
    dbContext,
    newHashResult.value
  );
  if (updateResult.isErr()) {
    return err(updateResult.error);
  }

  return ok(undefined);
};
