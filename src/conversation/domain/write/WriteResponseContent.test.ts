import { ok } from "neverthrow";
import { describe, it, expect } from "vitest";

import { createWriteResponseContent } from "./WriteResponseContent";

describe("WriteResponseContent", () => {
  // 最大コンテンツ長を返すモック関数
  const mockGetMaxContentLength = async () => {
    return ok(1000);
  };

  it("正常な値で作成できること", async () => {
    const result = await createWriteResponseContent(
      "これはテスト投稿です",
      mockGetMaxContentLength
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteResponseContent");
      expect(result.value.val).toBe("これはテスト投稿です");
    }
  });

  it("空文字列の場合はエラーになること", async () => {
    const result = await createWriteResponseContent(
      "",
      mockGetMaxContentLength
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("本文は必須です");
    }
  });

  it("最大文字数を超える場合はエラーになること", async () => {
    // 文字数制限を10に設定するモック
    const mockGetMaxContentLength10 = async () => {
      return ok(10);
    };

    const result = await createWriteResponseContent(
      "これは長すぎるテスト投稿です",
      mockGetMaxContentLength10
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("本文は10文字以内で入力してください");
    }
  });

  it("ちょうど最大文字数の場合は作成できること", async () => {
    // 文字数制限を10に設定するモック
    const mockGetMaxContentLength10 = async () => {
      return ok(10);
    };

    const result = await createWriteResponseContent(
      "ちょうど10文字",
      mockGetMaxContentLength10
    );

    expect(result.isOk()).toBe(true);
  });
});
