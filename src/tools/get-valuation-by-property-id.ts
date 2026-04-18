import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getValuationByPropertyIdInputSchema = {
  property_id: z.number().int().describe("Propalt property_id."),
  postcode: z.string().optional().describe("Outward postcode only (e.g. 'SA11', 'NW3'). Overrides DB value if provided."),
  type: z.enum(["selling", "letting"]).optional().describe("Query type. Default 'selling'."),
  num_beds: z.number().int().min(1).max(20).optional().describe("Number of bedrooms (1–20). Overrides DB value if provided."),
  total_floor_area: z.number().int().min(10).max(600).optional().describe("Total floor area in sq m (10–600). Overrides DB value if provided."),
  property_type: z.enum(["bungalow", "house", "flat"]).optional().describe("Property type. Overrides DB value if provided."),
  built_form: z.enum(["detached", "semi_detached", "terraced", "flat", "maisonette", "studio"]).optional().describe("Built form. Overrides DB value if provided."),
};

export const getValuationByPropertyIdDescription =
  "Look up property features by property_id, merge with client overrides, and retrieve AVM valuation. Cross-validation: if property_type is 'bungalow' or 'house', built_form must be detached/semi_detached/terraced; if 'flat', built_form must be flat/maisonette/studio.";

export function makeGetValuationByPropertyIdHandler(api: ApiClient) {
  return async (input: Record<string, unknown>) => {
    const data = await api.request("POST", "/valuation/get-valuation-by-property-id", { body: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
