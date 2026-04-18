import { z } from "zod";
import type { ApiClient } from "../api-client.js";

const propertyTypeEnum = z.enum(["Detached", "Flat", "Semi-Detached", "Terraced"]);
const propertyType2Enum = z.enum(["House", "Flat", "Bungalow"]);
const proprietorTypeEnum = z.enum(["private", "business", "house_association", "local_authority"]);

export const getPropertiesV2InputSchema = {
  first_postcode: z.string().optional().describe("UK outward postcode (e.g. 'NW3'). Provide exactly one of first_postcode, sector_code_list, or polygon_str."),
  sector_code_list: z.array(z.string()).max(4).optional().describe("List of UK postcode sectors, max 4."),
  polygon_str: z.string().optional().describe("Polygon geometry string defining the search area (max 15 sq. miles)."),
  limit: z.number().int().min(1).max(50).optional().describe("Maximum properties to return. Default 50, max 50."),
  return_type: z.enum(["count", "data"]).optional().describe("'count' returns count only; 'data' returns full property records. Default 'count'."),
  add_latest_event: z.union([z.literal(0), z.literal(1)]).optional().describe("Include latest listing/sale event per property. 0 = no, 1 = yes. Default 0."),
  tenure: z.enum(["freehold", "leasehold"]).optional(),
  property_type_list: z.array(propertyTypeEnum).optional().describe("Built Form list: Detached, Flat, Semi-Detached, Terraced."),
  property_type_list_2: z.array(propertyType2Enum).optional().describe("Property type list: House, Flat, Bungalow."),
  numbeds: z.string().optional().describe("Bedrooms. Valid input N or N-M, 1<=N<M<=20."),
  proprietor_type_list: z.array(proprietorTypeEnum).optional(),
  epc_rating: z.string().optional().describe("EPC rating. Valid input N or N-M, A<=N<M<=G."),
  taxband_rating: z.string().optional().describe("Council tax band. Valid input N or N-M, A<=N<M<=I."),
  internal_size: z.string().optional().describe("Internal size in sq m. Valid input N-M, 20<=N<M<=520."),
  plot_size: z.string().optional().describe("Plot size in sq m. Valid input N-M, 20<=N<M<=99999."),
  in_urban_area: z.union([z.literal(0), z.literal(1)]).optional().describe("Filter for properties in urban areas."),
  density_range: z.string().optional().describe("Density range. Valid input N or N-M, 0<=N<M<=100."),
  selling_predict_price: z.string().optional().describe("Selling price estimate. Valid input N or N-M, sale:10000<=N<M."),
  letting_predict_price: z.string().optional().describe("Letting price estimate. Valid input N or N-M, rent:100<=N<M."),
  land_register_sold_date: z.string().optional().describe("Land registry sold date range (DDMMYYYY-DDMMYYYY)."),
  no_selling_months: z.number().int().min(0).optional().describe("0 = not for sale now; N>0 = no selling records in last N months."),
  no_letting_months: z.number().int().min(-1).optional().describe("0 = not for let now; -1 = no letting records ever; N>0 = no records in last N months."),
};

export const getPropertiesV2Description =
  "Find UK residential properties in one area. Provide exactly one area selector: first_postcode, sector_code_list (max 4), or polygon_str (max 15 sq miles). Filter by tenure, type, beds, ownership, EPC/tax band, size, urban/density, valuation, sold date, activity windows, or latest event.";

export function makeGetPropertiesV2Handler(api: ApiClient) {
  return async (input: Record<string, unknown>) => {
    const data = await api.request("POST", "/property/v2/get-properties", { body: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
