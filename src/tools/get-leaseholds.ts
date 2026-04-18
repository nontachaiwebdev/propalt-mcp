import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getLeaseholdsInputSchema = {
  property_id: z.number().int().describe("Propalt property_id."),
};

export const getLeaseholdsDescription =
  "Retrieve leasehold records for a property by property ID.";

export function makeGetLeaseholdsHandler(api: ApiClient) {
  return async (input: { property_id: number }) => {
    const data = await api.request("GET", "/organisation/get-leaseholds", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
