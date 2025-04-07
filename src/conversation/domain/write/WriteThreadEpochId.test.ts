import { describe, it, expect } from "vitest";

import {
  generateWriteThreadEpochId,
  createWriteThreadEpochId,
} from "./WriteThreadEpochId";

describe("WriteThreadEpochId", () => {
  describe("generateWriteThreadEpochId", () => {
    it("投稿日時から正しいエポックIDを生成すること", () => {
      // WritePostedAtのモック
      const mockPostedAt = {
        _type: "WritePostedAt" as const,
        val: new Date("2025-04-07T12:00:00Z"),
      };

      const result = generateWriteThreadEpochId(mockPostedAt);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value._type).toBe("WriteThreadEpochId");
        // 2025-04-07T12:00:00Z のエポックタイムスタンプ（秒）
        const expectedEpoch = Math.floor(mockPostedAt.val.getTime() / 1000);
        expect(result.value.val).toBe(expectedEpoch);
      }
    });
  });

  describe("createWriteThreadEpochId", () => {
    it("有効な数値文字列から作成できること", () => {
      const result = createWriteThreadEpochId("1712476800"); // 2025-04-07T12:00:00Z のエポックタイムスタンプ

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value._type).toBe("WriteThreadEpochId");
        expect(result.value.val).toBe(1712476800);
      }
    });

    it("数値に変換できない文字列の場合はエラーになること", () => {
      const invalidValues = ["abc", "123abc", "undefined", "null"];

      invalidValues.forEach((value) => {
        const result = createWriteThreadEpochId(value);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.message).toBe(
            "ThreadEpochIdは数値である必要があります"
          );
        }
      });
    });

    it("空文字列の場合はエラーになること", () => {
      const result = createWriteThreadEpochId("");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "ThreadEpochIdは空文字列にできません"
        );
      }
    });
  });
});
