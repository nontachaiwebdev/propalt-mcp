import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getQuarterlyMarketAnalysisInputSchema = {
  first_postcode: z.string().describe("UK outward postcode (e.g. 'NW3')."),
  return_national: z.enum(["y", "n"]).optional().describe("'y' to also return national comparison. Default 'n'."),
};

export const getQuarterlyMarketAnalysisDescription =
  "Retrieve quarterly market analysis data (listings, sales, prices, SSTC times, reductions) by postcode outward code.";

export function makeGetQuarterlyMarketAnalysisHandler(api: ApiClient) {
  return async (input: { first_postcode: string; return_national?: "y" | "n" }) => {
    const data = await api.request("GET", "/market-analytics/get-quarterly-market-analysis", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
