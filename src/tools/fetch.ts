import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const fetchInputSchema = {
  id: z.string().min(1).describe("Document id returned from a prior search call."),
};

export const fetchDescription =
  "Retrieve the full contents of a single document by id. Returns id, title, full text, optional url and metadata.";

export function makeFetchHandler(api: ApiClient) {
  return async ({ id }: { id: string }) => {
    const doc = await api.fetch(id);

    return {
      content: [{ type: "text" as const, text: JSON.stringify(doc) }],
      structuredContent: { ...doc } as Record<string, unknown>,
    };
  };
}
