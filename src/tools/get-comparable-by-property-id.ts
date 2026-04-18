import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getComparableByPropertyIdInputSchema = {
  property_id: z.number().int().describe("Propalt property_id."),
  postcode: z.string().optional().describe("Outward postcode only (e.g. 'SA11', 'NW3'). Overrides DB value if provided."),
  type: z.enum(["selling", "letting"]).optional().describe("Query type. Default 'selling'."),
  num_beds: z.number().int().min(1).max(20).optional().describe("Number of bedrooms (1–20). Overrides DB value if provided."),
  total_floor_area: z.number().int().min(10).max(600).optional().describe("Total floor area in sq m (10–600). Overrides DB value if provided."),
  property_type: z.enum(["bungalow", "house", "flat"]).optional().describe("Property type. Overrides DB value if provided."),
  built_form: z.enum(["detached", "semi_detached", "terraced", "flat", "maisonette", "studio"]).optional().describe("Built form. Overrides DB value if provided."),
  return_amount: z.number().int().min(5).max(30).optional().describe("Number of comparables to return (5–30). Default 10."),
  current_status: z.number().int().min(0).max(4).optional().describe("Status filter: 0=All, 1=For sale/rent, 2=Reduction, 3=Sold/Let, 4=Archive. Default 0."),
};

export const getComparableByPropertyIdDescription =
  "Look up property features by property_id, merge with client overrides, and retrieve comparable properties. Cross-validation: if property_type is 'bungalow' or 'house', built_form must be detached/semi_detached/terraced; if 'flat', built_form must be flat/maisonette/studio.";

export function makeGetComparableByPropertyIdHandler(api: ApiClient) {
  return async (input: Record<string, unknown>) => {
    const data = await api.request("POST", "/comparables/get-comparable-by-property-id", { body: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
