import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getBrandboardInputSchema = {
  place_id: z.number().int().optional().describe("Place ID (provide either place_id or postcode)."),
  postcode: z.string().optional().describe("Full UK postcode (provide either place_id or postcode)."),
};

export const getBrandboardDescription =
  "Retrieve broadband availability, speed, and usage data for a place by ID or postcode.";

export function makeGetBrandboardHandler(api: ApiClient) {
  return async (input: { place_id?: number; postcode?: string }) => {
    const data = await api.request("GET", "/place-area/get-brandboard", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
