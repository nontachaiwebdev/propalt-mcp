import { randomBytes } from "node:crypto";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";

export interface AuthCodeRecord {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scopes: string[];
  resource?: string;
  expiresAt: number;
}

export interface AccessTokenRecord {
  clientId: string;
  scopes: string[];
  resource?: string;
  expiresAt: number;
}

export interface RefreshTokenRecord {
  clientId: string;
  scopes: string[];
  resource?: string;
}

export const AUTH_CODE_TTL_SECONDS = 300;
export const ACCESS_TOKEN_TTL_SECONDS = 3600;
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

export class OAuthStore {
  readonly clients = new Map<string, OAuthClientInformationFull>();
  readonly authCodes = new Map<string, AuthCodeRecord>();
  readonly accessTokens = new Map<string, AccessTokenRecord>();
  readonly refreshTokens = new Map<string, RefreshTokenRecord>();

  startJanitor(intervalMs = 5 * 60 * 1000): NodeJS.Timeout {
    const timer = setInterval(() => this.purgeExpired(), intervalMs);
    timer.unref();
    return timer;
  }

  purgeExpired(now = Math.floor(Date.now() / 1000)): void {
    for (const [code, rec] of this.authCodes) {
      if (rec.expiresAt <= now) this.authCodes.delete(code);
    }
    for (const [token, rec] of this.accessTokens) {
      if (rec.expiresAt <= now) this.accessTokens.delete(token);
    }
  }
}

export function generateOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
