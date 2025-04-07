import { describe, it, expect } from "vitest";

import { createWritePostedAt, generateCurrentPostedAt } from "./WritePostedAt";

describe("WritePostedAt", () => {
  it("指定した日時で作成できること", () => {
    const testDate = new Date("2025-04-07T12:00:00Z");
    const result = createWritePostedAt(testDate);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value._type).toBe("WritePostedAt");
      expect(result.value.val).toEqual(testDate);
    }
  });

  it("generateCurrentPostedAtで現在時刻の値オブジェクトを生成できること", () => {
    const before = new Date();
    const postedAt = generateCurrentPostedAt();
    const after = new Date();

    expect(postedAt._type).toBe("WritePostedAt");

    // 現在時刻で生成されたことを確認（生成時刻の前後に位置する）
    expect(postedAt.val.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(postedAt.val.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
