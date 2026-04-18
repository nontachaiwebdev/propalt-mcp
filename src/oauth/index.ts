import { InMemoryOAuthProvider } from "./provider.js";
import { OAuthStore } from "./store.js";

export { InMemoryOAuthProvider } from "./provider.js";

export function createOAuthProvider(): InMemoryOAuthProvider {
  const store = new OAuthStore();
  store.startJanitor();
  return new InMemoryOAuthProvider(store);
}
