import { randomBytes } from "node:crypto";

type ClientType = "claude" | "chatgpt" | "local" | "confidential" | "public";

interface IssuedClient {
  client_id: string;
  client_secret?: string;
  client_name: string;
  redirect_uris: string[];
  redirect_uri_prefixes?: string[];
  token_endpoint_auth_method: "none" | "client_secret_post";
}

const TYPE_DEFAULTS: Record<ClientType, { isPublic: boolean; redirect_uris: string[]; redirect_uri_prefixes?: string[] }> = {
  claude: {
    isPublic: false,
    redirect_uris: [
      "https://claude.ai/api/mcp/auth_callback",
      "https://claude.com/api/mcp/auth_callback",
    ],
  },
  chatgpt: {
    isPublic: true,
    redirect_uris: [],
    redirect_uri_prefixes: ["https://chatgpt.com/connector/oauth/"],
  },
  local: {
    isPublic: false,
    redirect_uris: ["http://localhost:6274/oauth/callback"],
  },
  confidential: {
    isPublic: false,
    redirect_uris: [],
  },
  public: {
    isPublic: true,
    redirect_uris: [],
  },
};

function parseArgs(argv: string[]): { name: string; type: ClientType; redirectUris: string[] } {
  let name: string | undefined;
  let type: ClientType = "confidential";
  const redirectUris: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case "--name":
        if (!next) usageExit("--name requires a value");
        name = next;
        i++;
        break;
      case "--type":
        if (!next) usageExit("--type requires a value");
        if (!isClientType(next)) usageExit(`--type must be one of claude|chatgpt|local|confidential|public (got ${next})`);
        type = next;
        i++;
        break;
      case "--redirect-uri":
        if (!next) usageExit("--redirect-uri requires a value");
        try {
          new URL(next);
        } catch {
          usageExit(`--redirect-uri must be a valid URL (got ${next})`);
        }
        redirectUris.push(next);
        i++;
        break;
      case "-h":
      case "--help":
        printUsage();
        process.exit(0);
        break;
      default:
        usageExit(`unknown argument: ${arg}`);
    }
  }

  if (!name) usageExit("--name is required");
  return { name: name!, type, redirectUris };
}

function isClientType(value: string): value is ClientType {
  return (
    value === "claude" ||
    value === "chatgpt" ||
    value === "local" ||
    value === "confidential" ||
    value === "public"
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "client";
}

function issue(name: string, type: ClientType, extraRedirectUris: string[]): IssuedClient {
  const defaults = TYPE_DEFAULTS[type];
  const suffix = randomBytes(4).toString("hex");
  const client_id = `propalt-${slugify(name)}-${suffix}`;
  const issued: IssuedClient = {
    client_id,
    client_name: name,
    redirect_uris: [...defaults.redirect_uris, ...extraRedirectUris],
    token_endpoint_auth_method: defaults.isPublic ? "none" : "client_secret_post",
  };
  if (!defaults.isPublic) {
    issued.client_secret = randomBytes(32).toString("base64url");
  }
  if (defaults.redirect_uri_prefixes) {
    issued.redirect_uri_prefixes = defaults.redirect_uri_prefixes;
  }
  return issued;
}

function printUsage(): void {
  console.log(`Usage:
  npm run issue-client -- --name "<label>" [--type claude|chatgpt|local|confidential|public] [--redirect-uri <url>]...

Examples:
  npm run issue-client -- --name "Acme Corp" --type claude
  npm run issue-client -- --name "Acme Corp" --type chatgpt
  npm run issue-client -- --name "Local test" --type confidential --redirect-uri http://localhost:6274/oauth/callback
`);
}

function usageExit(msg: string): never {
  console.error(`error: ${msg}\n`);
  printUsage();
  process.exit(1);
}

function main(): void {
  const { name, type, redirectUris } = parseArgs(process.argv.slice(2));
  const issued = issue(name, type, redirectUris);
  const mcpUrl = process.env.PUBLIC_BASE_URL
    ? `${process.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/mcp`
    : "https://<your-host>/mcp";

  const banner = (label: string): string => `=== ${label} ${"=".repeat(Math.max(0, 60 - label.length - 4))}`;

  console.log(banner("SEND TO CUSTOMER"));
  console.log(`MCP URL:        ${mcpUrl}`);
  console.log(`CLIENT_ID:      ${issued.client_id}`);
  if (issued.client_secret) {
    console.log(`CLIENT_SECRET:  ${issued.client_secret}`);
    console.log(`                (only shown now — not recoverable)`);
  } else {
    console.log(`CLIENT_SECRET:  (none — public client, PKCE only)`);
  }
  if (type === "chatgpt") {
    console.log(`Token endpoint auth method: none`);
  }
  console.log("");
  console.log(banner("ADD TO MCP_CLIENTS_JSON"));
  console.log(JSON.stringify(issued));
  console.log("");
  console.log(banner("NOTES"));
  console.log("- Append the JSON line above as a new entry inside the MCP_CLIENTS_JSON array.");
  console.log("- Restart the server (Railway redeploy) for the new client to take effect.");
  console.log("- To revoke: remove the entry and restart.");
}

main();
