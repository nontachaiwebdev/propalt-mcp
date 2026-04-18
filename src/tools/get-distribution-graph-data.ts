import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getDistributionGraphDataInputSchema = {
  first_postcode: z.string().describe("UK outward postcode (e.g. 'NW3')."),
};

export const getDistributionGraphDataDescription =
  "Get selling valuation distribution graph data for a postcode outward code.";

export function makeGetDistributionGraphDataHandler(api: ApiClient) {
  return async (input: { first_postcode: string }) => {
    const data = await api.request("GET", "/market-analytics/get-distribution-graph-data", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
