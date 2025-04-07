import { describe, it, expect } from "vitest";

import { generateWritePasswordHash } from "./WritePasswordHash";

// WritePasswordのモック作成
const createMockWritePassword = (value: string) => {
  return { _type: "WritePassword" as const, val: value };
};

describe("WritePasswordHash", () => {
  it("パスワードが正常にハッシュ化されること", async () => {
    const password = createMockWritePassword("test123");
    const result = await generateWritePasswordHash(password);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WritePasswordHash");
      expect(result.value.val).toBeTruthy();
      // ハッシュ化されたパスワードは元のパスワードと異なるはずです
      expect(result.value.val).not.toBe(password.val);
      // bcryptのハッシュは通常$で始まります
      expect(result.value.val.startsWith("$")).toBe(true);
    }
  });

  it("空のパスワードでもハッシュ化できること", async () => {
    const password = createMockWritePassword("");
    const result = await generateWritePasswordHash(password);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WritePasswordHash");
      expect(result.value.val).toBeTruthy();
    }
  });
});
