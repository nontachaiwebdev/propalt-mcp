import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const streetLookupInputSchema = {
  query: z.string().min(1).max(200).describe("Street or location text to search in the UK via Google Places Text Search."),
};

export const streetLookupDescription =
  "Use for UK street or location search when the user provides query text. Returns up to 5 Google Places matches with formatted address, latitude and longitude, and the viewport converted to a closed WKT polygon.";

export function makeStreetLookupHandler(api: ApiClient) {
  return async (input: { query: string }) => {
    const data = await api.request("POST", "/location-search/street-lookup", { body: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
