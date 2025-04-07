import { describe, it, expect } from "vitest";

import { createWriteResponseNumber } from "./WriteResponseNumber";

describe("WriteResponseNumber", () => {
  it("正常な値（1以上）で作成できること", () => {
    const result = createWriteResponseNumber(1);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteResponseNumber");
      expect(result.value.val).toBe(1);
    }
  });

  it("大きな数値でも作成できること", () => {
    const result = createWriteResponseNumber(1000);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteResponseNumber");
      expect(result.value.val).toBe(1000);
    }
  });

  it("0の場合はエラーになること", () => {
    const result = createWriteResponseNumber(0);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("レス番号は1以上です");
    }
  });

  it("負の数の場合はエラーになること", () => {
    const result = createWriteResponseNumber(-5);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("レス番号は1以上です");
    }
  });
});
