import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { ClientEntry } from "./client-entries.js";

export class StaticClientsStore implements OAuthRegisteredClientsStore {
  private readonly clients = new Map<string, OAuthClientInformationFull>();
  private readonly prefixes = new Map<string, string[]>();

  constructor(entries: ClientEntry[]) {
    const issuedAt = Math.floor(Date.now() / 1000);
    for (const e of entries) {
      const isPublic = e.token_endpoint_auth_method === "none";
      this.clients.set(e.client_id, {
        client_id: e.client_id,
        client_id_issued_at: issuedAt,
        client_secret: isPublic ? undefined : e.client_secret,
        client_secret_expires_at: isPublic ? undefined : 0,
        redirect_uris: e.redirect_uris,
        token_endpoint_auth_method: e.token_endpoint_auth_method,
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        client_name: e.client_name,
        scope: e.scopes.length > 0 ? e.scopes.join(" ") : undefined,
      });
      if (e.redirect_uri_prefixes && e.redirect_uri_prefixes.length > 0) {
        this.prefixes.set(e.client_id, e.redirect_uri_prefixes);
      }
    }
  }

  getClient(clientId: string): OAuthClientInformationFull | undefined {
    return this.clients.get(clientId);
  }

  getPrefixes(clientId: string): string[] {
    return this.prefixes.get(clientId) ?? [];
  }

  size(): number {
    return this.clients.size;
  }
}
