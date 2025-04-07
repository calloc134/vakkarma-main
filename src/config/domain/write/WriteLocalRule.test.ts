import { describe, it, expect } from "vitest";

import { createWriteLocalRule } from "./WriteLocalRule";

describe("WriteLocalRule", () => {
  it("正常な値で作成できること", () => {
    const result = createWriteLocalRule(
      "このボードではマナーを守って投稿してください"
    );
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteLocalRule");
      expect(result.value.val).toBe(
        "このボードではマナーを守って投稿してください"
      );
    }
  });

  it("空文字列の場合はエラーになること", () => {
    const result = createWriteLocalRule("");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("ローカルルールを入力してください");
    }
  });

  it("100文字を超える場合はエラーになること", () => {
    const longText = "あ".repeat(101); // 101文字
    const result = createWriteLocalRule(longText);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe(
        "ローカルルールは100文字以内で入力してください"
      );
    }
  });

  it("ちょうど100文字の場合は作成できること", () => {
    const text100 = "あ".repeat(100); // 100文字
    const result = createWriteLocalRule(text100);
    expect(result.isOk()).toBe(true);
  });
});
