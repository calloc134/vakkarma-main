import { ok } from "neverthrow";
import { describe, it, expect } from "vitest";

import { createWriteAuthorName } from "./WriteAuthorName";

describe("WriteAuthorName", () => {
  // デフォルトの投稿者名を返すモック関数
  const mockGetDefaultAuthorName = async () => {
    return ok("名無しさん");
  };

  it("通常の投稿者名で作成できること", async () => {
    const result = await createWriteAuthorName(
      "テスト太郎",
      mockGetDefaultAuthorName
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteAuthorName");
      expect(result.value.val._type).toBe("none");
      expect(result.value.val.authorName).toBe("テスト太郎");
    }
  });

  it("投稿者名がnullの場合はデフォルト名が使用されること", async () => {
    const result = await createWriteAuthorName(null, mockGetDefaultAuthorName);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteAuthorName");
      expect(result.value.val._type).toBe("none");
      expect(result.value.val.authorName).toBe("名無しさん");
    }
  });

  it("トリップ付きの名前で作成できること", async () => {
    const result = await createWriteAuthorName(
      "テスト#test123",
      mockGetDefaultAuthorName
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteAuthorName");
      expect(result.value.val._type).toBe("some");
      expect(result.value.val.authorName).toBe("テスト");
      if (result.value.val._type === "some") {
        expect(result.value.val.trip).toBeTruthy(); // トリップが生成されていること
      }
    }
  });

  it("100文字を超える名前はエラーになること", async () => {
    const longName = "あ".repeat(101); // 101文字
    const result = await createWriteAuthorName(
      longName,
      mockGetDefaultAuthorName
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("名前は100文字以内です");
    }
  });

  it("ちょうど100文字の名前で作成できること", async () => {
    const name100 = "あ".repeat(100); // 100文字
    const result = await createWriteAuthorName(
      name100,
      mockGetDefaultAuthorName
    );

    expect(result.isOk()).toBe(true);
  });
});
