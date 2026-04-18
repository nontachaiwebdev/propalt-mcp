import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const addressLookupInputSchema = {
  keyword: z.string().max(200).describe("Full postcode, outward code, local authority name, or free-text address."),
  address: z.string().optional().describe("Set to any truthy value to force full-text address search."),
  limit: z.number().int().max(10).optional().describe("Maximum results to return (<=10)."),
};

export const addressLookupDescription =
  "Use for UK address lookup. Send keyword as a full postcode, outward code, local authority name, or free-text address. Set address to any truthy value to force full-text address search. Returns status and data; each result is an address, postcode, first_postcode, or authority item.";

export function makeAddressLookupHandler(api: ApiClient) {
  return async (input: { keyword: string; address?: string; limit?: number }) => {
    const data = await api.request("GET", "/location-search/address-lookup", {
      query: { keyword: input.keyword, address: input.address, limit: input.limit },
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
