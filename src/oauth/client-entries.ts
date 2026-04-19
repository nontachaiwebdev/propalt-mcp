import { readFileSync } from "node:fs";
import { z } from "zod";

export const ClientEntrySchema = z
  .object({
    client_id: z.string().min(8),
    client_secret: z.string().min(16).optional(),
    client_name: z.string().optional(),
    redirect_uris: z.array(z.string().url()).default([]),
    redirect_uri_prefixes: z.array(z.string().url()).optional(),
    token_endpoint_auth_method: z.enum(["none", "client_secret_post"]).default("client_secret_post"),
    scopes: z.array(z.string()).default([]),
  })
  .refine((e) => e.token_endpoint_auth_method === "none" || Boolean(e.client_secret), {
    message: "client_secret is required when token_endpoint_auth_method is 'client_secret_post'",
  })
  .refine(
    (e) => (e.redirect_uris.length > 0) || (e.redirect_uri_prefixes?.length ?? 0) > 0,
    { message: "at least one of redirect_uris or redirect_uri_prefixes is required" },
  );

export type ClientEntry = z.infer<typeof ClientEntrySchema>;

const ClientEntryListSchema = z.array(ClientEntrySchema);

export function loadClientEntries(env: NodeJS.ProcessEnv = process.env): ClientEntry[] {
  const raw = env.MCP_CLIENTS_JSON ?? readFromFile(env.MCP_CLIENTS_FILE);
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`MCP_CLIENTS_JSON is not valid JSON: ${(err as Error).message}`);
  }

  const result = ClientEntryListSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`MCP_CLIENTS_JSON failed validation: ${result.error.message}`);
  }

  const seen = new Set<string>();
  for (const entry of result.data) {
    if (seen.has(entry.client_id)) {
      throw new Error(`MCP_CLIENTS_JSON contains duplicate client_id: ${entry.client_id}`);
    }
    seen.add(entry.client_id);
  }

  return result.data;
}

function readFromFile(path: string | undefined): string | undefined {
  if (!path) return undefined;
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    throw new Error(`MCP_CLIENTS_FILE could not be read at ${path}: ${(err as Error).message}`);
  }
}
