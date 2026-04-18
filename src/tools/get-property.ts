import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getPropertyInputSchema = {
  property_id: z.number().int().optional().describe("Propalt property_id."),
  uprn: z.number().int().optional().describe("Unique Property Reference Number."),
  udprn: z.number().int().optional().describe("Unique Delivery Point Reference Number."),
};

export const getPropertyDescription =
  "Retrieve detailed property information by property_id, uprn, or udprn. Provide at least one.";

export function makeGetPropertyHandler(api: ApiClient) {
  return async (input: { property_id?: number; uprn?: number; udprn?: number }) => {
    const data = await api.request("GET", "/property/get-property", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
