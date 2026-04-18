import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getNearbySchoolInputSchema = {
  postcode: z.string().optional().describe("Full UK postcode (provide either postcode or lat+lng)."),
  lat: z.number().min(49.5).max(61).optional().describe("Latitude (UK range 49.5–61)."),
  lng: z.number().min(-8.7).max(2).optional().describe("Longitude (UK range -8.7 to 2)."),
};

export const getNearbySchoolDescription =
  "Find the 20 nearest schools to a postcode or lat/lng location, with full school details.";

export function makeGetNearbySchoolHandler(api: ApiClient) {
  return async (input: { postcode?: string; lat?: number; lng?: number }) => {
    const data = await api.request("GET", "/place-area/get-nearby-school", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
