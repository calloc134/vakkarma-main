import { describe, it, expect } from "vitest";

import { createWriteBoardName } from "./WriteBoardName";
import { createWriteDefaultAuthorName } from "./WriteDefaultAuthorName";
import { createWriteLocalRule } from "./WriteLocalRule";
import { createWriteMaxContentLength } from "./WriteMaxContentLength";
import { createWriteNormalConfig } from "./WriteNormalConfig";

describe("WriteNormalConfig", () => {
  it("正常な値で作成できること", () => {
    const boardNameResult = createWriteBoardName("テスト掲示板");
    const localRuleResult = createWriteLocalRule("テストのルールです");
    const defaultAuthorNameResult = createWriteDefaultAuthorName("名無しさん");
    const maxContentLengthResult = createWriteMaxContentLength(1000);

    // すべての値が正常に作成されていることを確認
    expect(boardNameResult.isOk()).toBe(true);
    expect(localRuleResult.isOk()).toBe(true);
    expect(defaultAuthorNameResult.isOk()).toBe(true);
    expect(maxContentLengthResult.isOk()).toBe(true);

    if (
      boardNameResult.isOk() &&
      localRuleResult.isOk() &&
      defaultAuthorNameResult.isOk() &&
      maxContentLengthResult.isOk()
    ) {
      const result = createWriteNormalConfig({
        boardName: boardNameResult.value,
        localRule: localRuleResult.value,
        defaultAuthorName: defaultAuthorNameResult.value,
        maxContentLength: maxContentLengthResult.value,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value._type).toBe("WriteNormalConfig");
        expect(result.value.boardName).toBe(boardNameResult.value);
        expect(result.value.localRule).toBe(localRuleResult.value);
        expect(result.value.defaultAuthorName).toBe(
          defaultAuthorNameResult.value
        );
        expect(result.value.maxContentLength).toBe(
          maxContentLengthResult.value
        );
      }
    }
  });
});
