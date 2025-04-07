import { createRoute } from "honox/factory";

import { postThreadUsecase } from "../../../src/conversation/usecases/postThreadUsecase";
import { ErrorMessage } from "../../components/ErrorMessage";
import { getIpAddress } from "../../utils/getIpAddress";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const POST = createRoute(async (c) => {
  const { sql, logger } = c.var;

  logger.info({
    operation: "threads/POST",
    path: c.req.path,
    method: c.req.method,
    message: "Starting new thread creation request"
  });

  const body = await c.req.parseBody();
  const title = body.title;
  const name = typeof body.name === "string" ? body.name : null;
  const mail = typeof body.mail === "string" ? body.mail : null;
  const content = body.content;

  logger.debug({
    operation: "threads/POST",
    hasTitle: typeof title === "string",
    hasContent: typeof content === "string",
    hasName: name !== null,
    hasMail: mail !== null,
    message: "Request body parsed for thread creation"
  });

  if (typeof title !== "string" || typeof content !== "string") {
    logger.warn({
      operation: "threads/POST",
      validationError: "Missing required fields",
      hasTitle: typeof title === "string",
      hasContent: typeof content === "string",
      message: "Thread creation validation failed - missing required fields"
    });
    return c.render(
      <ErrorMessage error={new Error("タイトルと本文は必須です")} />
    );
  }

  const ipAddressRaw = getIpAddress(c);
  
  logger.debug({
    operation: "threads/POST",
    ipAddress: ipAddressRaw,
    message: "IP address extracted for thread creation"
  });

  const postThreadResult = await postThreadUsecase(
    { sql, logger },
    {
      threadTitleRaw: title,
      authorNameRaw: name,
      mailRaw: mail,
      responseContentRaw: content,
      ipAddressRaw,
    }
  );
  if (postThreadResult.isErr()) {
    logger.error({
      operation: "threads/POST",
      error: postThreadResult.error,
      message: "Thread creation failed in usecase layer"
    });
    return c.render(<ErrorMessage error={postThreadResult.error} />);
  }
  const threadId = postThreadResult.value.val;
  
  logger.info({
    operation: "threads/POST",
    threadId,
    message: "Thread created successfully, redirecting to thread page"
  });
  
  return c.redirect(`/threads/${threadId}`, 303);
});

export default createRoute((c) => {
  const { logger } = c.var;
  
  logger.debug({
    operation: "threads/GET",
    path: c.req.path,
    method: c.req.method,
    message: "Thread index page requested, redirecting to home page"
  });
  
  return c.redirect("/", 302);
});
