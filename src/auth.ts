import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { OAuthTokenVerifier } from "@modelcontextprotocol/sdk/server/auth/provider.js";
// Side-effect import: augments Express Request with `auth?: AuthInfo`.
import "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";

export interface DualAuthOptions {
  legacyToken?: string;
  verifier: OAuthTokenVerifier;
  resourceMetadataUrl?: string;
}

export function dualAuth({ legacyToken, verifier, resourceMetadataUrl }: DualAuthOptions) {
  const legacyBuf = legacyToken ? Buffer.from(legacyToken) : null;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.header("authorization") ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) {
      unauthorized(res, "invalid_token", "missing bearer token", resourceMetadataUrl);
      return;
    }

    const token = match[1].trim();

    if (legacyBuf) {
      const provided = Buffer.from(token);
      if (
        provided.length === legacyBuf.length &&
        timingSafeEqual(provided, legacyBuf)
      ) {
        req.auth = {
          token,
          clientId: "legacy-bearer",
          scopes: [],
        };
        next();
        return;
      }
    }

    try {
      req.auth = await verifier.verifyAccessToken(token);
      next();
    } catch {
      unauthorized(res, "invalid_token", "invalid or expired access token", resourceMetadataUrl);
    }
  };
}

function unauthorized(
  res: Response,
  errorCode: string,
  description: string,
  resourceMetadataUrl?: string,
): void {
  const params = [`error="${errorCode}"`, `error_description="${description}"`];
  if (resourceMetadataUrl) {
    params.push(`resource_metadata="${resourceMetadataUrl}"`);
  }
  res.set("WWW-Authenticate", `Bearer ${params.join(", ")}`);
  res.status(401).json({ error: errorCode, error_description: description });
}
