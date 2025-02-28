import { env } from "hono/adapter";

import { getConnInfowithRuntimeSwitch } from "./getConnInfoRuntimeSwitch";

import type { Context } from "hono";

export const getIpAddress = (c: Context): string => {
  // ヘッダからプロキシの識別子とヘッダを取得
  const customProxyId = c.req.header("X-Custom-ProxyID") || "";
  const xForwardedFor = c.req.header("X-Forwarded-For");

  // 信頼できるプロキシ識別子を取得
  const trustedProxyId = env<{ TRUSTED_PROXY_ID: string }>(c).TRUSTED_PROXY_ID;

  // もし一致していれば
  if (customProxyId === trustedProxyId && xForwardedFor) {
    // プロキシの識別子を取得
    return xForwardedFor;
  }

  // X-Forwarded-For ヘッダが使えない場合はgetConnInfoで試す

  const getConnInfoFunc = getConnInfowithRuntimeSwitch(c);
  const ipAddressRaw = getConnInfoFunc();

  if (ipAddressRaw.isOk()) {
    return ipAddressRaw.value;
  }

  // どちらも取得できない場合は空文字を返す
  return "";
};
