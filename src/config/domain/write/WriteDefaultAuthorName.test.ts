import { describe, it, expect } from "vitest";

import { createWriteDefaultAuthorName } from "./WriteDefaultAuthorName";

describe("WriteDefaultAuthorName", () => {
  it("正常な値で作成できること", () => {
    const result = createWriteDefaultAuthorName("名無しさん");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteDefaultAuthorName");
      expect(result.value.val).toBe("名無しさん");
    }
  });

  it("空文字列の場合はエラーになること", () => {
    const result = createWriteDefaultAuthorName("");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe(
        "デフォルトのユーザ名を入力してください"
      );
    }
  });

  it("20文字を超える場合はエラーになること", () => {
    const result = createWriteDefaultAuthorName(
      "あいうえおかきくけこさしすせそたちつてとな"
    ); // 21文字
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe(
        "デフォルトのユーザ名は20文字以内で入力してください"
      );
    }
  });

  it("ちょうど20文字の場合は作成できること", () => {
    const result = createWriteDefaultAuthorName(
      "あいうえおかきくけこさしすせそたちつてと"
    ); // 20文字
    expect(result.isOk()).toBe(true);
  });
});
