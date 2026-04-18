import type { Response } from "express";
import {
  InvalidGrantError,
  InvalidRequestError,
  InvalidTokenError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type {
  AuthorizationParams,
  OAuthServerProvider,
} from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type {
  OAuthClientInformationFull,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { InMemoryClientsStore } from "./clients-store.js";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_CODE_TTL_SECONDS,
  OAuthStore,
  generateOpaqueToken,
  nowSeconds,
} from "./store.js";

export class InMemoryOAuthProvider implements OAuthServerProvider {
  readonly clientsStore: InMemoryClientsStore;

  constructor(private readonly store: OAuthStore) {
    this.clientsStore = new InMemoryClientsStore(store);
  }

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response,
  ): Promise<void> {
    const code = generateOpaqueToken();
    this.store.authCodes.set(code, {
      clientId: client.client_id,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: "S256",
      scopes: params.scopes ?? [],
      resource: params.resource?.toString(),
      expiresAt: nowSeconds() + AUTH_CODE_TTL_SECONDS,
    });

    const redirect = new URL(params.redirectUri);
    redirect.searchParams.set("code", code);
    if (params.state) redirect.searchParams.set("state", params.state);
    res.redirect(redirect.toString());
  }

  async challengeForAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string,
  ): Promise<string> {
    const record = this.store.authCodes.get(authorizationCode);
    if (!record) throw new InvalidGrantError("authorization code not found");
    return record.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    redirectUri?: string,
    resource?: URL,
  ): Promise<OAuthTokens> {
    const record = this.store.authCodes.get(authorizationCode);
    if (!record) throw new InvalidGrantError("authorization code not found");

    this.store.authCodes.delete(authorizationCode);

    if (record.expiresAt <= nowSeconds()) {
      throw new InvalidGrantError("authorization code expired");
    }
    if (record.clientId !== client.client_id) {
      throw new InvalidGrantError("authorization code was issued to a different client");
    }
    if (redirectUri && record.redirectUri !== redirectUri) {
      throw new InvalidGrantError("redirect_uri mismatch");
    }

    return this.issueTokens(client.client_id, record.scopes, resource?.toString() ?? record.resource);
  }

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    resource?: URL,
  ): Promise<OAuthTokens> {
    const record = this.store.refreshTokens.get(refreshToken);
    if (!record) throw new InvalidGrantError("refresh token not found");
    if (record.clientId !== client.client_id) {
      throw new InvalidGrantError("refresh token was issued to a different client");
    }

    // Rotate: invalidate old refresh token
    this.store.refreshTokens.delete(refreshToken);

    const grantedScopes = scopes && scopes.length > 0 ? scopes : record.scopes;
    if (scopes) {
      for (const s of scopes) {
        if (!record.scopes.includes(s)) {
          throw new InvalidRequestError(`scope "${s}" exceeds original grant`);
        }
      }
    }

    return this.issueTokens(client.client_id, grantedScopes, resource?.toString() ?? record.resource);
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const record = this.store.accessTokens.get(token);
    if (!record) throw new InvalidTokenError("access token not found");
    if (record.expiresAt <= nowSeconds()) {
      this.store.accessTokens.delete(token);
      throw new InvalidTokenError("access token expired");
    }
    return {
      token,
      clientId: record.clientId,
      scopes: record.scopes,
      expiresAt: record.expiresAt,
      resource: record.resource ? new URL(record.resource) : undefined,
    };
  }

  private issueTokens(clientId: string, scopes: string[], resource?: string): OAuthTokens {
    const accessToken = generateOpaqueToken();
    const refreshToken = generateOpaqueToken();
    const expiresAt = nowSeconds() + ACCESS_TOKEN_TTL_SECONDS;

    this.store.accessTokens.set(accessToken, {
      clientId,
      scopes,
      resource,
      expiresAt,
    });
    this.store.refreshTokens.set(refreshToken, {
      clientId,
      scopes,
      resource,
    });

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      refresh_token: refreshToken,
      scope: scopes.join(" ") || undefined,
    };
  }
}
