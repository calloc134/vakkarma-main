import { describe, it, expect } from "vitest";

import { generateWriteHashId, createWriteHashId } from "./WriteHashId";

describe("WriteHashId", () => {
  describe("generateWriteHashId", () => {
    it("IPアドレスと日付から有効なハッシュIDを生成できること", () => {
      const ipAddress = "192.168.1.1";
      const date = new Date("2025-04-07");
      const result = generateWriteHashId(ipAddress, date);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value._type).toBe("WriteHashId");
        expect(result.value.val.length).toBe(8); // ハッシュIDは8文字
      }
    });

    it("同じIPと日付からは同じハッシュIDが生成されること", () => {
      const ipAddress = "192.168.1.1";
      const date = new Date("2025-04-07");

      const result1 = generateWriteHashId(ipAddress, date);
      const result2 = generateWriteHashId(ipAddress, date);

      expect(result1.isOk() && result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.val).toBe(result2.value.val);
      }
    });

    it("異なるIPからは異なるハッシュIDが生成されること", () => {
      const date = new Date("2025-04-07");

      const result1 = generateWriteHashId("192.168.1.1", date);
      const result2 = generateWriteHashId("192.168.1.2", date);

      expect(result1.isOk() && result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.val).not.toBe(result2.value.val);
      }
    });

    it("異なる日付からは異なるハッシュIDが生成されること", () => {
      const ipAddress = "192.168.1.1";

      const result1 = generateWriteHashId(ipAddress, new Date("2025-04-07"));
      const result2 = generateWriteHashId(ipAddress, new Date("2025-04-08"));

      expect(result1.isOk() && result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.val).not.toBe(result2.value.val);
      }
    });
  });

  describe("createWriteHashId", () => {
    it("8文字の文字列から有効なハッシュIDを作成できること", () => {
      const result = createWriteHashId("12345678");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value._type).toBe("WriteHashId");
        expect(result.value.val).toBe("12345678");
      }
    });

    it("8文字未満の文字列ではエラーになること", () => {
      const result = createWriteHashId("1234567");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("ハッシュIDは8文字です");
      }
    });

    it("8文字を超える文字列ではエラーになること", () => {
      const result = createWriteHashId("123456789");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("ハッシュIDは8文字です");
      }
    });
  });
});
