import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getAnalysisDataInputSchema = {
  first_postcode: z.string().describe("UK outward postcode (e.g. 'NW3')."),
};

export const getAnalysisDataDescription =
  "Retrieve regional analysis data (property characteristics, energy costs, dwelling counts) by postcode outward code.";

export function makeGetAnalysisDataHandler(api: ApiClient) {
  return async (input: { first_postcode: string }) => {
    const data = await api.request("GET", "/market-analytics/get-analysis-data", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
