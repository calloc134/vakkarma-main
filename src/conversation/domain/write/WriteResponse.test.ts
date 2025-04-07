import { err, ok } from "neverthrow";
import { describe, it, expect } from "vitest";

import { createWriteResponse } from "./WriteResponse";

describe("WriteResponse", () => {
  it("正常なパラメータでレスポンスを作成できること", async () => {
    // 必要な値オブジェクトのモック
    const mockAuthorName = {
      _type: "WriteAuthorName" as const,
      val: { _type: "none" as const, authorName: "テスト太郎" },
    };
    const mockMail = { _type: "WriteMail" as const, val: "test@example.com" };
    const mockResponseContent = {
      _type: "WriteResponseContent" as const,
      val: "これはテスト投稿です",
    };
    const mockHashId = { _type: "WriteHashId" as const, val: "abcd1234" };
    const mockPostedAt = {
      _type: "WritePostedAt" as const,
      val: new Date("2025-04-07T12:00:00Z"),
    };

    // ThreadId取得モック関数
    const mockGetThreadId = async () => {
      return ok("01890c08-4754-7d1c-89aa-beee49bf4ffe");
    };

    const result = await createWriteResponse({
      authorName: mockAuthorName,
      mail: mockMail,
      responseContent: mockResponseContent,
      hashId: mockHashId,
      postedAt: mockPostedAt,
      getThreadId: mockGetThreadId,
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const response = result.value;
      expect(response._type).toBe("WriteResponse");
      expect(response.authorName).toBe(mockAuthorName);
      expect(response.mail).toBe(mockMail);
      expect(response.responseContent).toBe(mockResponseContent);
      expect(response.hashId).toBe(mockHashId);
      expect(response.postedAt).toBe(mockPostedAt);

      // 自動生成されるIDフィールドの検証
      expect(response.id._type).toBe("WriteResponseId");
      expect(response.id.val).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      ); // UUIDv7形式

      // スレッドIDの検証
      expect(response.threadId._type).toBe("WriteThreadId");
      expect(response.threadId.val).toBe(
        "01890c08-4754-7d1c-89aa-beee49bf4ffe"
      );
    }
  });

  it("スレッドID取得でエラーが発生した場合、エラーを返すこと", async () => {
    // 必要な値オブジェクトのモック
    const mockAuthorName = {
      _type: "WriteAuthorName" as const,
      val: { _type: "none" as const, authorName: "テスト太郎" },
    };
    const mockMail = { _type: "WriteMail" as const, val: "test@example.com" };
    const mockResponseContent = {
      _type: "WriteResponseContent" as const,
      val: "これはテスト投稿です",
    };
    const mockHashId = { _type: "WriteHashId" as const, val: "abcd1234" };
    const mockPostedAt = {
      _type: "WritePostedAt" as const,
      val: new Date("2025-04-07T12:00:00Z"),
    };

    // エラーを返すスレッドID取得モック
    const mockGetThreadIdWithError = async () => {
      return err(new Error("スレッドIDの取得に失敗しました"));
    };

    const result = await createWriteResponse({
      authorName: mockAuthorName,
      mail: mockMail,
      responseContent: mockResponseContent,
      hashId: mockHashId,
      postedAt: mockPostedAt,
      getThreadId: mockGetThreadIdWithError,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("スレッドIDの取得に失敗しました");
    }
  });

  it("無効なスレッドIDの場合、エラーを返すこと", async () => {
    // 必要な値オブジェクトのモック
    const mockAuthorName = {
      _type: "WriteAuthorName" as const,
      val: { _type: "none" as const, authorName: "テスト太郎" },
    };
    const mockMail = { _type: "WriteMail" as const, val: "test@example.com" };
    const mockResponseContent = {
      _type: "WriteResponseContent" as const,
      val: "これはテスト投稿です",
    };
    const mockHashId = { _type: "WriteHashId" as const, val: "abcd1234" };
    const mockPostedAt = {
      _type: "WritePostedAt" as const,
      val: new Date("2025-04-07T12:00:00Z"),
    };

    // 無効なスレッドIDを返すモック
    const mockGetInvalidThreadId = async () => {
      return ok("invalid-uuid");
    };

    const result = await createWriteResponse({
      authorName: mockAuthorName,
      mail: mockMail,
      responseContent: mockResponseContent,
      hashId: mockHashId,
      postedAt: mockPostedAt,
      getThreadId: mockGetInvalidThreadId,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("不正なスレッドIDです");
    }
  });
});
