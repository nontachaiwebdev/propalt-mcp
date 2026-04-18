import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getPlaceInputSchema = {
  place_id: z.number().int().optional().describe("Place ID (provide either place_id or postcode)."),
  postcode: z.string().optional().describe("Full UK postcode (provide either place_id or postcode)."),
};

export const getPlaceDescription =
  "Retrieve a place record by ID or postcode, enriched with average property floor areas by type.";

export function makeGetPlaceHandler(api: ApiClient) {
  return async (input: { place_id?: number; postcode?: string }) => {
    const data = await api.request("GET", "/place-area/get-place", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
