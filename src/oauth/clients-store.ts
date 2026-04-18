import { randomBytes } from "node:crypto";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { OAuthStore } from "./store.js";

export class InMemoryClientsStore implements OAuthRegisteredClientsStore {
  constructor(private readonly store: OAuthStore) {}

  getClient(clientId: string): OAuthClientInformationFull | undefined {
    return this.store.clients.get(clientId);
  }

  registerClient(
    input: Omit<OAuthClientInformationFull, "client_id" | "client_id_issued_at">,
  ): OAuthClientInformationFull {
    const clientId = `mcp-${randomBytes(16).toString("base64url")}`;
    const now = Math.floor(Date.now() / 1000);

    const authMethod = input.token_endpoint_auth_method ?? "client_secret_post";
    const isPublicClient = authMethod === "none";

    const client: OAuthClientInformationFull = {
      ...input,
      client_id: clientId,
      client_id_issued_at: now,
      ...(isPublicClient
        ? { client_secret: undefined, client_secret_expires_at: undefined }
        : {
            client_secret: randomBytes(32).toString("base64url"),
            client_secret_expires_at: 0,
          }),
    };

    console.log("[oauth] /register accepted", {
      clientId,
      tokenEndpointAuthMethod: authMethod,
      isPublicClient,
      redirectUris: input.redirect_uris,
      grantTypes: input.grant_types,
      clientName: input.client_name,
    });

    this.store.clients.set(clientId, client);
    return client;
  }
}
