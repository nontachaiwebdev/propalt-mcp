import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getPropertyHistoryInputSchema = {
  property_id: z.number().int().describe("Propalt property_id."),
};

export const getPropertyHistoryDescription =
  "Retrieve full event history for a property by property_id.";

export function makeGetPropertyHistoryHandler(api: ApiClient) {
  return async (input: { property_id: number }) => {
    const data = await api.request("GET", "/market-activity/get-property-history", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
