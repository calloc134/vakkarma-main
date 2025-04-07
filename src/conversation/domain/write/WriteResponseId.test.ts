import { describe, it, expect } from "vitest";

import { generateResponseId, createResponseId } from "./WriteResponseId";

describe("WriteResponseId", () => {
  describe("generateResponseId", () => {
    it("有効なUUIDv7を生成すること", () => {
      const responseId = generateResponseId();

      expect(responseId._type).toBe("WriteResponseId");
      // UUIDv7の形式チェック（36文字でハイフンを含む）
      expect(responseId.val).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it("生成されるUUIDv7は一意であること", () => {
      const responseId1 = generateResponseId();
      const responseId2 = generateResponseId();

      expect(responseId1.val).not.toBe(responseId2.val);
    });
  });

  describe("createResponseId", () => {
    it("有効なUUIDv7文字列で作成できること", () => {
      // テスト用の有効なUUIDv7
      const validUuid = "01890c08-4754-7d1c-89aa-beee49bf4ffe";
      const result = createResponseId(validUuid);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value._type).toBe("WriteResponseId");
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
        const result = createResponseId(uuid);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.message).toBe("不正なレスIDです");
        }
      });
    });
  });
});
