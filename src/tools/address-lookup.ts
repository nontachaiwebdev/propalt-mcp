import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const addressLookupInputSchema = {
  keyword: z.string().max(200).describe("Full postcode, outward code, local authority name, or free-text address."),
  address: z.union([z.string(), z.boolean()]).optional().describe("Set to true (or any non-empty string) to force full-text address search. Accepts boolean or string."),
  limit: z.number().int().max(10).optional().describe("Maximum results to return (<=10)."),
};

export const addressLookupDescription =
  "Use for UK address lookup. Send keyword as a full postcode, outward code, local authority name, or free-text address. Set address to true to force full-text address search. Returns status and data; each result is an address, postcode, first_postcode, or authority item.";

export function makeAddressLookupHandler(api: ApiClient) {
  return async (input: { keyword: string; address?: string | boolean; limit?: number }) => {
    const addressParam =
      input.address === true ? "1"
      : input.address === false ? undefined
      : input.address;

    const data = await api.request("GET", "/location-search/address-lookup", {
      query: { keyword: input.keyword, address: addressParam, limit: input.limit },
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
