import { describe, it, expect } from "vitest";

import { createWriteBoardName } from "./WriteBoardName";

describe("WriteBoardName", () => {
  it("正常な値で作成できること", () => {
    const result = createWriteBoardName("テスト掲示板");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteBoardName");
      expect(result.value.val).toBe("テスト掲示板");
    }
  });

  it("空文字列の場合はエラーになること", () => {
    const result = createWriteBoardName("");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("ボード名は必須です");
    }
  });

  it("50文字を超える場合はエラーになること", () => {
    const result = createWriteBoardName(
      "いろはにほへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせす。。。。"
    ); // 51文字
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe(
        "ボード名は50文字以内で入力してください"
      );
    }
  });

  it("ちょうど20文字の場合は作成できること", () => {
    const result = createWriteBoardName(
      "あいうえおかきくけこさしすせそたちつてと"
    ); // 20文字
    expect(result.isOk()).toBe(true);
  });
});
