import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getSoldPropertiesInputSchema = {
  first_postcode: z.string().optional().describe("UK outward postcode (e.g. 'NW3'). Provide either first_postcode or postcode."),
  postcode: z.string().optional().describe("Full UK postcode. Provide either first_postcode or postcode."),
  limit: z.number().int().min(1).max(100).optional().describe("Max records (1–100). Default 100."),
  page: z.number().int().min(0).optional().describe("0-based page number. Default 0."),
};

export const getSoldPropertiesDescription =
  "Retrieve sold property records by outward code or full postcode.";

export function makeGetSoldPropertiesHandler(api: ApiClient) {
  return async (input: { first_postcode?: string; postcode?: string; limit?: number; page?: number }) => {
    const data = await api.request("GET", "/market-activity/get-sold-properties", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
