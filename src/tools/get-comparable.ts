import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getComparableInputSchema = {
  postcode: z.string().describe("Full UK postcode, e.g. 'SA11 2LR', 'NW3 5HT'."),
  type: z.enum(["selling", "letting"]).optional().describe("Query type. Default 'selling'."),
  num_beds: z.number().int().min(1).max(20).describe("Number of bedrooms (1–20)."),
  total_floor_area: z.number().int().min(10).max(600).optional().describe("Total floor area in sq m (10–600)."),
  property_type: z.enum(["bungalow", "house", "flat"]).describe("Property type."),
  built_form: z.enum(["detached", "semi_detached", "terraced", "flat", "maisonette", "studio"]).describe("Built form / sub-type."),
  return_amount: z.number().int().min(5).max(30).optional().describe("Number of comparables to return (5–30). Default 10."),
  current_status: z.number().int().min(0).max(4).optional().describe("Status filter: 0=All, 1=For sale/rent, 2=Reduction, 3=Sold/Let, 4=Archive. Default 0."),
};

export const getComparableDescription =
  "Retrieve comparable properties from the external comparables API. Cross-validation: if property_type is 'bungalow' or 'house', built_form must be detached/semi_detached/terraced; if property_type is 'flat', built_form must be flat/maisonette/studio.";

export function makeGetComparableHandler(api: ApiClient) {
  return async (input: Record<string, unknown>) => {
    const data = await api.request("POST", "/comparables/get-comparable", { body: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
