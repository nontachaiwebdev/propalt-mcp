import { z } from "zod";
import type { ApiClient } from "../api-client.js";

const propertyTypeEnum = z.enum(["Detached", "Flat", "Semi-Detached", "Terraced"]);
const proprietorTypeEnum = z.enum(["private", "business", "house_association", "local_authority"]);

export const audienceLettingPropertyInputSchema = {
  first_postcode: z.string().optional().describe("UK outward postcode (e.g. 'SA1'). Provide exactly one of first_postcode, sector_code_list, or polygon_str."),
  sector_code_list: z.array(z.string()).max(4).optional().describe("List of UK postcode sectors (e.g. ['SA1 1', 'SA1 2']), max 4."),
  polygon_str: z.string().optional().describe("Polygon geometry string defining the search area (max 15 sq. miles)."),
  limit: z.number().int().min(1).max(20).optional().describe("Maximum number of properties to return. Default 20, max 20."),
  return_type: z.enum(["count", "data"]).optional().describe("'count' returns a count only; 'data' returns full property records. Default 'data'."),
  progress: z.enum(["reduction", "for_rent", "withdrawn", "let_agreed"]).optional().describe("Letting progress filter. Default 'for_rent'."),
  tenure: z.enum(["freehold", "leasehold"]).optional(),
  property_type_list: z.array(propertyTypeEnum).optional().describe("List of Built Form: Detached, Flat, Semi-Detached, Terraced."),
  numbeds: z.string().optional().describe("Number of bedrooms. Valid input N or N-M, 1<=N<M<=20."),
  proprietor_type_list: z.array(proprietorTypeEnum).optional(),
  epc_rating: z.string().optional().describe("EPC rating. Valid input N or N-M, A<=N<M<=G."),
  internal_size: z.string().optional().describe("Internal size range in sq m. Valid input N-M, 20<=N<M<=520."),
  plot_size: z.string().optional().describe("Plot size range in sq m. Valid input N-M, 20<=N<M<=99999."),
  first_listed_date: z.string().optional().describe("Valid formats: DDMMYYYY-DDMMYYYY or min_week:N|max_week:M or min_month:N|max_month:M."),
  reduce_date: z.string().optional().describe("Valid formats: DDMMYYYY-DDMMYYYY or min_week:N|max_week:M or min_month:N|max_month:M."),
  let_agreed_date: z.string().optional().describe("Valid formats: DDMMYYYY-DDMMYYYY or min_week:N|max_week:M or min_month:N|max_month:M."),
  listing_price: z.string().optional().describe("Listing price. Valid input N or N-M, rent:100<=N<M."),
  HMO_property: z.literal(1).optional().describe("Set to 1 to return HMO properties only."),
  potential_HMO: z.literal(1).optional().describe("Set to 1 to return potential HMO properties only."),
  disabled_access_property: z.literal(1).optional().describe("Set to 1 to return disabled-access properties only."),
  retirement_property: z.literal(1).optional().describe("Set to 1 to return retirement properties only."),
};

export const audienceLettingPropertyDescription =
  "Find UK rental listings in one area. Provide exactly one area selector: first_postcode, sector_code_list (max 4), or polygon_str (max 15 sq miles). Use progress and filters for tenure, type, beds, ownership, EPC, size, dates, rent, HMO, accessibility, or retirement; return count or data.";

export function makeAudienceLettingPropertyHandler(api: ApiClient) {
  return async (input: Record<string, unknown>) => {
    const data = await api.request("POST", "/audience/letting-property", { body: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
