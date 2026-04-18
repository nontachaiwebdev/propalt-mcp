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
    const clientSecret = randomBytes(32).toString("base64url");
    const now = Math.floor(Date.now() / 1000);

    const client: OAuthClientInformationFull = {
      ...input,
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: now,
      client_secret_expires_at: 0,
    };

    this.store.clients.set(clientId, client);
    return client;
  }
}
