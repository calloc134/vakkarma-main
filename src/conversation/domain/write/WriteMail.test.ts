import { describe, it, expect } from "vitest";

import { createWriteMail } from "./WriteMail";

describe("WriteMail", () => {
  it("有効なメールアドレスで作成できること", () => {
    const result = createWriteMail("test@example.com");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteMail");
      expect(result.value.val).toBe("test@example.com");
    }
  });

  it("nullの場合は空文字列として作成されること", () => {
    const result = createWriteMail(null);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteMail");
      expect(result.value.val).toBe("");
    }
  });

  it("空文字列は有効として扱われること", () => {
    const result = createWriteMail("");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteMail");
      expect(result.value.val).toBe("");
    }
  });

  it('"sage"は有効として扱われること', () => {
    const result = createWriteMail("sage");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteMail");
      expect(result.value.val).toBe("sage");
    }
  });

  it('"SAGE"（大文字）も有効として扱われること', () => {
    const result = createWriteMail("SAGE");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteMail");
      expect(result.value.val).toBe("SAGE");
    }
  });

  it("255文字を超えるメールアドレスはエラーになること", () => {
    // 長い名前部分 + @ + ドメイン部分 で255文字を超えるアドレスを作成
    const longName = "a".repeat(250);
    const longMail = `${longName}@example.com`; // 250 + 12 = 262文字

    const result = createWriteMail(longMail);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("メールアドレスは255文字以内です");
    }
  });

  it("不正なメールアドレス形式はエラーになること", () => {
    const invalidMails = [
      "plaintext",
      "missing@",
      "@missing.com",
      "double@@example.com",
      "missing.domain@",
      "space in@example.com",
    ];

    invalidMails.forEach((mail) => {
      const result = createWriteMail(mail);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("不正なメールアドレス形式です");
      }
    });
  });
});
