import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const searchInputSchema = {
  query: z
    .string()
    .min(1)
    .max(200)
    .describe("Free-text UK address, postcode, or location to search."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe("Maximum results to return (1-10). Defaults to 10."),
};

export const searchDescription =
  "Search for UK properties and locations by free-text query. Returns a list of results with id, title, and url. Use the id with the fetch tool to retrieve full property details.";

type AddressLookupItem = {
  type?: string;
  property_id?: number | string;
  uprn?: number | string;
  udprn?: number | string;
  postcode?: string;
  first_postcode?: string;
  address?: string;
  thoroughfare?: string;
  town?: string;
  authority?: string;
};

type AddressLookupResponse = {
  status?: string;
  data?: AddressLookupItem[];
};

function pickTitle(item: AddressLookupItem): string {
  if (item.address) return item.address;
  if (item.thoroughfare && item.town) return `${item.thoroughfare}, ${item.town}`;
  if (item.postcode && item.town) return `${item.postcode} — ${item.town}`;
  if (item.postcode) return item.postcode;
  if (item.first_postcode) return item.first_postcode;
  if (item.authority) return item.authority;
  return "Unknown location";
}

function pickId(item: AddressLookupItem): string | undefined {
  if (item.property_id !== undefined && item.property_id !== null) {
    return String(item.property_id);
  }
  if (item.postcode) return `postcode:${item.postcode}`;
  if (item.first_postcode) return `first_postcode:${item.first_postcode}`;
  if (item.authority) return `authority:${item.authority}`;
  return undefined;
}

function pickUrl(item: AddressLookupItem): string {
  const id = pickId(item) ?? "";
  return `https://propalt.io/property/${encodeURIComponent(id)}`;
}

export function makeSearchHandler(api: ApiClient) {
  return async (input: { query: string; limit?: number }) => {
    const data = (await api.request("GET", "/location-search/address-lookup", {
      query: { keyword: input.query, limit: input.limit ?? 10 },
    })) as AddressLookupResponse;

    const items = Array.isArray(data?.data) ? data.data : [];
    const results = items
      .map((item) => {
        const id = pickId(item);
        if (!id) return null;
        return {
          id,
          title: pickTitle(item),
          url: pickUrl(item),
        };
      })
      .filter((r): r is { id: string; title: string; url: string } => r !== null);

    const payload = { results };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  };
}
