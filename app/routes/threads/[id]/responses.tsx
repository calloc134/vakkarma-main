import { createRoute } from "honox/factory";

import { postResponseByThreadIdUsecase } from "../../../../src/conversation/usecases/postResponseByThreadIdUsecase";
import { ErrorMessage } from "../../../components/ErrorMessage";
import { getIpAddress } from "../../../utils/getIpAddress";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const POST = createRoute(async (c) => {
  const { sql, logger } = c.var;
  const id = c.req.param("id");
  if (!id)
    return c.render(
      <ErrorMessage error={new Error("スレッドIDが指定されていません")} />
    );

  const body = await c.req.parseBody();
  const name = typeof body.name === "string" ? body.name : null;
  const mail = typeof body.mail === "string" ? body.mail : null;
  const content = body.content;
  // もし文字列じゃなかったらエラーを返す
  if (typeof content !== "string") {
    return c.render(<ErrorMessage error={new Error("本文は必須です")} />);
  }

  const ipAddressRaw = getIpAddress(c);

  // レス番号(responseNumber)は自動で振られるので、渡す必要はない
  // 整合性とレイヤ分離のトレードオフだが、ロジックとして重要な部分なので整合性を優先した
  const responseResult = await postResponseByThreadIdUsecase(
    { sql, logger },
    {
      threadIdRaw: id,
      authorNameRaw: name,
      mailRaw: mail,
      responseContentRaw: content,
      ipAddressRaw,
    }
  );
  if (responseResult.isErr()) {
    return c.render(<ErrorMessage error={responseResult.error} />);
  }

  return c.redirect(`/threads/${responseResult.value.val}`, 303);
});

export default createRoute((c) => {
  return c.render(
    <ErrorMessage error={new Error("POSTメソッドでアクセスしてください")} />
  );
});
