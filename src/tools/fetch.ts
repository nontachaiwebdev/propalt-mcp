import { z } from "zod";
import type { ApiClient } from "../api-client.js";

export const fetchInputSchema = {
  id: z
    .string()
    .min(1)
    .describe(
      "Result id from the search tool. Typically a numeric Propalt property_id as a string.",
    ),
};

export const fetchDescription =
  "Fetch full details for a UK property by id. Use an id returned by the search tool. Returns id, title, text summary, url, and the full property record as metadata.";

type PropertyRecord = {
  property_id?: number | string;
  address?: string;
  thoroughfare?: string;
  town?: string;
  postcode?: string;
  bedrooms?: number;
  reception_rooms?: number;
  bathrooms?: number;
  property_type?: string;
  size?: number;
  tenure?: string;
  avm?: number;
};

function buildTitle(p: PropertyRecord, id: string): string {
  if (p.address) return p.address;
  const parts = [p.thoroughfare, p.town, p.postcode].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return `Property ${id}`;
}

function buildText(p: PropertyRecord): string {
  const lines: string[] = [];
  if (p.address) lines.push(`Address: ${p.address}`);
  if (p.postcode) lines.push(`Postcode: ${p.postcode}`);
  if (p.property_type) lines.push(`Type: ${p.property_type}`);
  if (p.bedrooms !== undefined) lines.push(`Bedrooms: ${p.bedrooms}`);
  if (p.bathrooms !== undefined) lines.push(`Bathrooms: ${p.bathrooms}`);
  if (p.reception_rooms !== undefined) lines.push(`Reception rooms: ${p.reception_rooms}`);
  if (p.size !== undefined) lines.push(`Size: ${p.size}`);
  if (p.tenure) lines.push(`Tenure: ${p.tenure}`);
  if (p.avm !== undefined) lines.push(`Estimated value (AVM): ${p.avm}`);
  return lines.join("\n") || "Property details unavailable.";
}

export function makeFetchHandler(api: ApiClient) {
  return async (input: { id: string }) => {
    const propertyId = Number.parseInt(input.id, 10);
    if (!Number.isFinite(propertyId)) {
      throw new Error(
        `Invalid id "${input.id}". Expected a numeric property_id returned by the search tool.`,
      );
    }

    const data = (await api.request("GET", "/property/get-property", {
      query: { property_id: propertyId },
    })) as PropertyRecord;

    const title = buildTitle(data ?? {}, input.id);
    const text = buildText(data ?? {});
    const url = `https://propalt.io/property/${encodeURIComponent(input.id)}`;

    const payload = {
      id: input.id,
      title,
      text,
      url,
      metadata: (data ?? {}) as Record<string, unknown>,
    };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  };
}
