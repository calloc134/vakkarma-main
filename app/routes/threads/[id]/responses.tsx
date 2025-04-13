import { createRoute } from "honox/factory";

import { postResponseByThreadIdUsecase } from "../../../../src/conversation/usecases/postResponseByThreadIdUsecase";
import { ErrorMessage } from "../../../components/ErrorMessage";
import { getIpAddress } from "../../../utils/getIpAddress";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const POST = createRoute(async (c) => {
  const { sql, logger } = c.var;
  const id = c.req.param("id");

  logger.info({
    operation: "threads/[id]/responses/POST",
    path: c.req.path,
    method: c.req.method,
    threadId: id,
    message: "Response creation request received",
  });

  if (!id) {
    logger.warn({
      operation: "threads/[id]/responses/POST",
      message: "Thread ID not specified in request",
    });
    return c.render(
      <ErrorMessage error={new Error("スレッドIDが指定されていません")} />
    );
  }

  const body = await c.req.parseBody();
  const name = typeof body.name === "string" ? body.name : null;
  const mail = typeof body.mail === "string" ? body.mail : null;
  const content = body.content;

  logger.debug({
    operation: "threads/[id]/responses/POST",
    threadId: id,
    hasName: name !== null,
    hasMail: mail !== null,
    hasContent: typeof content === "string",
    message: "Request body parsed for response creation",
  });

  // もし文字列じゃなかったらエラーを返す
  if (typeof content !== "string") {
    logger.warn({
      operation: "threads/[id]/responses/POST",
      threadId: id,
      contentType: typeof content,
      message: "Response content is missing or invalid",
    });
    return c.render(<ErrorMessage error={new Error("本文は必須です")} />);
  }

  const ipAddressRaw = getIpAddress(c);

  logger.debug({
    operation: "threads/[id]/responses/POST",
    threadId: id,
    ipAddress: ipAddressRaw,
    message: "IP address extracted for response creation",
  });

  // レス番号(responseNumber)は自動で振られるので、渡す必要はない
  // 整合性とレイヤ分離のトレードオフだが、ロジックとして重要な部分なので整合性を優先した
  logger.debug({
    operation: "threads/[id]/responses/POST",
    threadId: id,
    message: "Calling postResponseByThreadIdUsecase",
  });

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
    logger.error({
      operation: "threads/[id]/responses/POST",
      threadId: id,
      error: responseResult.error,
      message: "Failed to create response",
    });
    return c.render(<ErrorMessage error={responseResult.error} />);
  }

  logger.info({
    operation: "threads/[id]/responses/POST",
    threadId: id,
    message: "Response created successfully, redirecting to thread page",
  });

  const { threadId } = responseResult.value;

  return c.redirect(`/threads/${threadId.val}/l10`, 303);
});

export default createRoute((c) => {
  const { logger } = c.var;

  logger.warn({
    operation: "threads/[id]/responses/GET",
    path: c.req.path,
    method: c.req.method,
    message: "Invalid method for response endpoint, GET method not supported",
  });

  return c.render(
    <ErrorMessage error={new Error("POSTメソッドでアクセスしてください")} />
  );
});
