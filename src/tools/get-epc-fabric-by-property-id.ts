import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const getEpcFabricByPropertyIdInputSchema = {
  property_id: z.number().int().describe("Propalt property_id."),
};

export const getEpcFabricByPropertyIdDescription =
  "Retrieve EPC fabric data (energy performance, building characteristics, costs) by property_id.";

export function makeGetEpcFabricByPropertyIdHandler(api: ApiClient) {
  return async (input: { property_id: number }) => {
    const data = await api.request("GET", "/property/get-epc-fabric-by-property-id", { query: input });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data) }],
      structuredContent: data as Record<string, unknown>,
    };
  };
}
