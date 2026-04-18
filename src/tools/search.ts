import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const searchInputSchema = {
  query: z.string().min(1).describe("Search query string."),
};

export const searchDescription =
  "Search the knowledge base and return a list of matching documents with id, title, text snippet, and optional url.";

export function makeSearchHandler(api: ApiClient) {
  return async ({ query }: { query: string }) => {
    const results = await api.search(query);
    const payload: Record<string, unknown> = { results };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  };
}
