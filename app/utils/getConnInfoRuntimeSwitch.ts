import { getConnInfo as getConnInfoOnNode } from "@hono/node-server/conninfo";
import { getRuntimeKey } from "hono/adapter";
import { getConnInfo as getConnInfoOnWorkers } from "hono/cloudflare-workers";
import { err, ok } from "neverthrow";

import { IpAddressNotFoundError } from "../../src/shared/types/Error";

import type { Context } from "hono";
import type { GetConnInfo } from "hono/conninfo";
import type { Result } from "neverthrow";

export const getConnInfowithRuntimeSwitch = (
  c: Context
): (() => Result<string, Error>) => {
  const runtime = getRuntimeKey();
  switch (runtime) {
    case "workerd":
      return (): Result<string, Error> => {
        try {
          const connInfo = getConnInfoOnWorkers(c);
          if (!connInfo || !connInfo.remote || !connInfo.remote.address) {
            return err(new IpAddressNotFoundError("IP address not found"));
          }
          return ok(connInfo.remote.address);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Unknown error";
          return err(new IpAddressNotFoundError(message));
        }
      };
    case "bun":
      return (): Result<string, Error> => {
        try {
          const connInfo = getConnInfoOnBun(c);
          if (!connInfo || !connInfo.remote || !connInfo.remote.address) {
            return err(new IpAddressNotFoundError("IP address not found"));
          }
          return ok(connInfo.remote.address);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Unknown error";
          return err(new IpAddressNotFoundError(message));
        }
      };
    case "node":
      return (): Result<string, Error> => {
        try {
          const connInfo = getConnInfoOnNode(c);
          if (!connInfo || !connInfo.remote || !connInfo.remote.address) {
            return err(new IpAddressNotFoundError("IP address not found"));
          }
          return ok(connInfo.remote.address);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Unknown error";
          return err(new IpAddressNotFoundError(message));
        }
      };
    case "deno":
      return (): Result<string, Error> => {
        try {
          const connInfo = getConnInfoDeno(c);
          if (!connInfo || !connInfo.remote || !connInfo.remote.address) {
            return err(new IpAddressNotFoundError("IP address not found"));
          }
          return ok(connInfo.remote.address);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Unknown error";
          return err(new IpAddressNotFoundError(message));
        }
      };
    default:
      // 例外なのでthrowでよい
      throw new Error(`Unknown runtime: ${runtime}`);
  }
};

/**
 * Get conninfo with Deno
 * @param c Context
 * @returns ConnInfo
 */
export const getConnInfoDeno: GetConnInfo = (c) => {
  const { remoteAddr } = c.env;
  return {
    remote: {
      address: remoteAddr.hostname,
      port: remoteAddr.port,
      transport: remoteAddr.transport,
    },
  };
};

export interface BunServer {
  requestIP?: (req: Request) => {
    address: string;
    family: string;
    port: number;
  };
  upgrade<T>(
    req: Request,
    options?: {
      data: T;
    }
  ): boolean;
}

/**
 * そのままimportすると動作しなかったのでコピペ
 * Get Bun Server Object from Context
 * @param c Context
 * @returns Bun Server
 */
export const getBunServer = (c: Context): BunServer | undefined =>
  ("server" in c.env ? c.env.server : c.env) as BunServer | undefined;

export const getConnInfoOnBun: GetConnInfo = (c: Context) => {
  const server = getBunServer(c);

  if (!server) {
    throw new TypeError("env has to include the 2nd argument of fetch.");
  }
  if (typeof server.requestIP !== "function") {
    throw new TypeError("server.requestIP is not a function.");
  }
  const info = server.requestIP(c.req.raw);

  return {
    remote: {
      address: info.address,
      addressType:
        info.family === "IPv6" || info.family === "IPv4"
          ? info.family
          : undefined,
      port: info.port,
    },
  };
};
