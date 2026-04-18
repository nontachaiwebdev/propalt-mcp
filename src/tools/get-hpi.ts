import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getHpiInputSchema = {
  postcode: z.string().describe("Full UK postcode."),
  statistic_region: z.enum(["Authority", "Region"]).optional().describe("Geographic level. Default 'Authority'."),
  statistic_time: z.number().int().min(1).max(10).optional().describe("Number of time points (1–10). Default 3."),
};

export const getHpiDescription =
  "Retrieve UK House Price Index data for a postcode at Authority or Region geographic level.";

export function makeGetHpiHandler(api: ApiClient) {
  return async (input: { postcode: string; statistic_region?: string; statistic_time?: number }) => {
    const data = await api.request("GET", "/market-activity/get-hpi", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
