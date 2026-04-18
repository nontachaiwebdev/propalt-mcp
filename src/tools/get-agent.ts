import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getAgentInputSchema = {
  first_postcode: z.string().min(2).max(4).optional().describe("UK outward postcode (e.g. 'NW3')."),
  brand_id: z.string().min(1).max(35).optional().describe("Agent brand identifier."),
  limit: z.number().int().min(1).max(100).optional().describe("Max records (1–100). Default 100."),
  page: z.number().int().min(0).optional().describe("0-based page number. Default 0."),
};

export const getAgentDescription =
  "Retrieve estate agent branches by first_postcode or brand_id with pagination.";

export function makeGetAgentHandler(api: ApiClient) {
  return async (input: { first_postcode?: string; brand_id?: string; limit?: number; page?: number }) => {
    const data = await api.request("GET", "/organisation/get-agent", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
