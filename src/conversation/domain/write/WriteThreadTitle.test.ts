import { describe, it, expect } from "vitest";

import { createWriteThreadTitle } from "./WriteThreadTitle";

describe("WriteThreadTitle", () => {
  it("正常な値で作成できること", () => {
    const result = createWriteThreadTitle("テストスレッド");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteThreadTitle");
      expect(result.value.val).toBe("テストスレッド");
    }
  });

  it("空文字列の場合はエラーになること", () => {
    const result = createWriteThreadTitle("");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("スレッドタイトルは必須です");
    }
  });

  it("100文字を超える場合はエラーになること", () => {
    const longTitle = "あ".repeat(101); // 101文字
    const result = createWriteThreadTitle(longTitle);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("スレッドタイトルは100文字以内です");
    }
  });

  it("ちょうど100文字の場合は作成できること", () => {
    const title100 = "あ".repeat(100); // 100文字
    const result = createWriteThreadTitle(title100);

    expect(result.isOk()).toBe(true);
  });

  it("使えない文字（<>）が含まれる場合はエラーになること", () => {
    const invalidTitles = [
      '<script>alert("XSS")</script>',
      "タイトル<b>太字</b>",
      "不正な>文字",
    ];

    invalidTitles.forEach((title) => {
      const result = createWriteThreadTitle(title);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "スレッドタイトルに使えない文字が含まれています"
        );
      }
    });
  });
});
