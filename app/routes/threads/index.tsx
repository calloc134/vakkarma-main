import { createRoute } from "honox/factory";

import { postThreadUsecase } from "../../../src/conversation/usecases/postThreadUsecase";
import { ErrorMessage } from "../../components/ErrorMessage";
import { getIpAddress } from "../../utils/getIpAddress";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const POST = createRoute(async (c) => {
  const { sql, logger } = c.var;

  const body = await c.req.parseBody();
  const title = body.title;
  const name = typeof body.name === "string" ? body.name : null;
  const mail = typeof body.mail === "string" ? body.mail : null;
  const content = body.content;

  if (typeof title !== "string" || typeof content !== "string") {
    return c.render(
      <ErrorMessage error={new Error("タイトルと本文は必須です")} />
    );
  }

  const ipAddressRaw = getIpAddress(c);

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
    return c.render(<ErrorMessage error={postThreadResult.error} />);
  }
  const threadId = postThreadResult.value.val;
  return c.redirect(`/threads/${threadId}`, 303);
});

export default createRoute((c) => {
  return c.redirect("/", 302);
});
