import { InMemoryOAuthProvider } from "./provider.js";
import { OAuthStore } from "./store.js";
import { StaticClientsStore } from "./clients-store.js";
import type { ClientEntry } from "./client-entries.js";

export { InMemoryOAuthProvider } from "./provider.js";
export { StaticClientsStore } from "./clients-store.js";
export { loadClientEntries } from "./client-entries.js";
export type { ClientEntry } from "./client-entries.js";

export function createOAuthProvider(entries: ClientEntry[]): InMemoryOAuthProvider {
  const store = new OAuthStore();
  store.startJanitor();
  const clientsStore = new StaticClientsStore(entries);
  return new InMemoryOAuthProvider(store, clientsStore);
}
