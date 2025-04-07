import { describe, it, expect } from "vitest";

import { createWritePassword } from "./WritePassword";

describe("WritePassword", () => {
  it("正常な値で作成できること", async () => {
    const result = await createWritePassword("password123");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WritePassword");
      expect(result.value.val).toBe("password123");
    }
  });

  it("空文字列の場合はエラーになること", async () => {
    const result = await createWritePassword("");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("パスワードを入力してください");
    }
  });
});
