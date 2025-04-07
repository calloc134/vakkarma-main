import { describe, it, expect } from "vitest";

import { createWriteThread } from "./WriteThread";

describe("WriteThread", () => {
  it("正常なパラメータでスレッドを作成できること", () => {
    // 必要な値オブジェクトのモック
    const mockThreadTitle = {
      _type: "WriteThreadTitle" as const,
      val: "テストスレッド",
    };
    const mockPostedAt = {
      _type: "WritePostedAt" as const,
      val: new Date("2025-04-07T12:00:00Z"),
    };

    const result = createWriteThread({
      title: mockThreadTitle,
      postedAt: mockPostedAt,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const thread = result.value;
      expect(thread._type).toBe("WriteThread");
      expect(thread.title).toBe(mockThreadTitle);
      expect(thread.postedAt).toBe(mockPostedAt);
      expect(thread.updatedAt).toBe(mockPostedAt); // postedAtと同じ値が設定される

      // 自動生成されるIDフィールドの検証
      expect(thread.id._type).toBe("WriteThreadId");
      expect(thread.id.val).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      ); // UUIDv7形式

      // epochIdの検証
      expect(thread.epochId._type).toBe("WriteThreadEpochId");
      expect(thread.epochId.val).toBe(
        Math.floor(mockPostedAt.val.getTime() / 1000)
      ); // 秒単位のタイムスタンプ
    }
  });
});
