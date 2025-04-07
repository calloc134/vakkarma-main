import { describe, it, expect } from "vitest";

import { createWriteMaxContentLength } from "./WriteMaxContentLength";

describe("WriteMaxContentLength", () => {
  it("正常な値で作成できること", () => {
    const result = createWriteMaxContentLength(1000);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WriteMaxContentLength");
      expect(result.value.val).toBe(1000);
    }
  });

  it("0以下の値の場合はエラーになること", () => {
    const result = createWriteMaxContentLength(0);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe(
        "コンテンツの最大長は0より大きい必要があります"
      );
    }
  });

  it("負の値の場合はエラーになること", () => {
    const result = createWriteMaxContentLength(-10);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe(
        "コンテンツの最大長は0より大きい必要があります"
      );
    }
  });

  it("1の場合は作成できること", () => {
    const result = createWriteMaxContentLength(1);
    expect(result.isOk()).toBe(true);
  });
});
