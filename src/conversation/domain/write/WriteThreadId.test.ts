import { describe, it, expect } from "vitest";

import { generateWriteThreadId, createWriteThreadId } from "./WriteThreadId";

describe("WriteThreadId", () => {
  describe("generateWriteThreadId", () => {
    it("有効なUUIDv7を生成すること", () => {
      const threadId = generateWriteThreadId();

      expect(threadId._type).toBe("WriteThreadId");
      // UUIDv7の形式チェック（36文字でハイフンを含む）
      expect(threadId.val).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("生成されるUUIDv7は一意であること", () => {
      const threadId1 = generateWriteThreadId();
      const threadId2 = generateWriteThreadId();

      expect(threadId1.val).not.toBe(threadId2.val);
    });
  });

  describe("createWriteThreadId", () => {
    it("有効なUUIDv7文字列で作成できること", () => {
      // テスト用の有効なUUIDv7
      const validUuid = "01890c08-4754-7d1c-89aa-beee49bf4ffe";
      const result = createWriteThreadId(validUuid);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value._type).toBe("WriteThreadId");
        expect(result.value.val).toBe(validUuid);
      }
    });

    it("無効なUUID形式ではエラーになること", () => {
      const invalidUuids = [
        "invalid-uuid",
        "123456",
        "01890c08-4754-8d1c-89aa-beee49bf4ffe", // バージョン8（無効）
        "01890c08-4754-6d1c-89aa-beee49bf4ffe", // バージョン6（無効）
        "01890c08475489aabeee49bf4ffe", // ハイフンなし
      ];

      invalidUuids.forEach((uuid) => {
        const result = createWriteThreadId(uuid);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.message).toBe("不正なスレッドIDです");
        }
      });
    });
  });
});
