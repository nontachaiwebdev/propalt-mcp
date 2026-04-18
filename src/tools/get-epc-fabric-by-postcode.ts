import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getEpcFabricByPostcodeInputSchema = {
  postcode: z.string().describe("Full UK postcode."),
};

export const getEpcFabricByPostcodeDescription =
  "Retrieve EPC fabric data (energy performance, building characteristics, costs) by postcode.";

export function makeGetEpcFabricByPostcodeHandler(api: ApiClient) {
  return async (input: { postcode: string }) => {
    const data = await api.request("GET", "/property/get-epc-fabric-by-postcode", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
