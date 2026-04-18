import { z } from "zod";
import type { ApiClient } from "../api-client.js";

const proprietorTypeEnum = z.enum(["private", "business", "house_association", "local_authority"]);

export const audienceLandlordsInputSchema = {
  first_postcode: z.string().optional().describe("UK outward postcode (e.g. 'SA1'). Provide exactly one of first_postcode, sector_code_list, or polygon_str."),
  sector_code_list: z.array(z.string()).max(4).optional().describe("List of UK postcode sectors (e.g. ['SA1 1', 'SA1 2']), max 4."),
  polygon_str: z.string().optional().describe("Polygon geometry string defining the search area (max 15 sq. miles)."),
  limit: z.number().int().min(1).max(20).optional().describe("Maximum number of properties to return. Default 20, max 20."),
  return_type: z.enum(["count", "data"]).optional().describe("'count' returns a count only; 'data' returns full property records. Default 'data'."),
  in_selected_area_landlords: z.union([z.literal(0), z.literal(1)]).optional().describe("1=only in-selected-area landlords, 0=only out-of-area, null=ignore."),
  linked_agents: z.string().optional().describe("Filter landlords by number of linked national agents. Valid input N or N-M."),
  director_age: z.string().optional().describe("For company proprietors. Valid input N or N-M, 18<=N<M<80."),
  director_count: z.string().optional().describe("For company proprietors. Valid input N or N-M, 1<=N<M<100."),
  portfolio_size: z.string().optional().describe("Portfolio size. Valid input N or N-M, 1<=N<M<=40000."),
  proprietor_type_list: z.array(proprietorTypeEnum).optional(),
  recently_purchased_count_range: z.string().optional().describe("Filter by national recently_purchased_count."),
  for_rent_count_range: z.string().optional().describe("Filter by national for_rent_count."),
  for_sale_count_range: z.string().optional().describe("Filter by national for_sale_count."),
};

export const audienceLandlordsDescription =
  "Find landlord/proprietor audiences for properties in one UK area. Provide one area selector: first_postcode, sector_code_list (max 4), or polygon_str (max 15 sq miles). Filter by area ownership, linked agents, director age/count, portfolio size, proprietor type, purchases, sale/rental listings.";

export function makeAudienceLandlordsHandler(api: ApiClient) {
  return async (input: Record<string, unknown>) => {
    const data = await api.request("POST", "/audience/landlords", { body: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
