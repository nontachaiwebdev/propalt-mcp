import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthRouter,
} from "@modelcontextprotocol/sdk/server/auth/router.js";
import { redirectUriMatches } from "@modelcontextprotocol/sdk/server/auth/handlers/authorize.js";
import { ApiClient } from "./api-client.js";
import { createMcpServer } from "./server.js";
import { dualAuth } from "./auth.js";
import { createOAuthProvider, loadClientEntries } from "./oauth/index.js";

const {
  MCP_BEARER_TOKEN,
  API_BASE_URL,
  PROPALT_API_KEY,
  PUBLIC_BASE_URL,
  PORT = "3000",
} = process.env;

if (!API_BASE_URL) throw new Error("API_BASE_URL env var is required");
if (!PROPALT_API_KEY) throw new Error("PROPALT_API_KEY env var is required");
if (!PUBLIC_BASE_URL) throw new Error("PUBLIC_BASE_URL env var is required");

const clientEntries = loadClientEntries();
if (clientEntries.length === 0 && !MCP_BEARER_TOKEN) {
  throw new Error(
    "No auth path configured: set MCP_CLIENTS_JSON (or MCP_CLIENTS_FILE) and/or MCP_BEARER_TOKEN",
  );
}
console.log(
  `[oauth] loaded ${clientEntries.length} pre-issued OAuth client(s)` +
    (MCP_BEARER_TOKEN ? " (legacy MCP_BEARER_TOKEN also enabled)" : ""),
);

const api = new ApiClient(API_BASE_URL, PROPALT_API_KEY);
const oauthProvider = createOAuthProvider(clientEntries);
const issuerUrl = new URL(PUBLIC_BASE_URL);
const mcpResourceUrl = new URL("/mcp", issuerUrl);
const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(mcpResourceUrl);

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "4mb" }));

app.use("/token", express.urlencoded({ extended: true }), (req, res, next) => {
  const body = req.body as Record<string, unknown>;
  console.log("[oauth] /token incoming", {
    contentType: req.header("content-type"),
    hasAuthzHeader: Boolean(req.header("authorization")),
    grant_type: body?.grant_type,
    client_id: body?.client_id,
    has_client_secret: Boolean(body?.client_secret),
    has_code: Boolean(body?.code),
    has_code_verifier: Boolean(body?.code_verifier),
    redirect_uri: body?.redirect_uri,
  });
  res.on("finish", () => {
    console.log("[oauth] /token finished", { status: res.statusCode });
  });
  next();
});

// Custom /authorize handler. Mounted BEFORE mcpAuthRouter so Express dispatches
// it first; the SDK's authorize handler is shadowed. Adds host-locked prefix
// matching for redirect_uris (needed for ChatGPT's per-connector dynamic
// callback https://chatgpt.com/connector/oauth/{id}).
app.all("/authorize", express.urlencoded({ extended: false }), async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const params = (req.method === "POST" ? req.body : req.query) as Record<string, string | undefined>;

  const clientId = params.client_id;
  if (!clientId || typeof clientId !== "string") {
    res.status(400).json({ error: "invalid_request", error_description: "client_id is required" });
    return;
  }

  const client = oauthProvider.clientsStore.getClient(clientId);
  if (!client) {
    res.status(400).json({ error: "invalid_client", error_description: "Invalid client_id" });
    return;
  }

  let redirectUri = typeof params.redirect_uri === "string" ? params.redirect_uri : undefined;
  if (redirectUri !== undefined && !URL.canParse(redirectUri)) {
    res.status(400).json({ error: "invalid_request", error_description: "redirect_uri must be a valid URL" });
    return;
  }

  if (redirectUri === undefined) {
    if (client.redirect_uris.length === 1) {
      redirectUri = client.redirect_uris[0];
    } else {
      res.status(400).json({
        error: "invalid_request",
        error_description: "redirect_uri must be specified when client has multiple registered URIs",
      });
      return;
    }
  } else {
    const exactOk = client.redirect_uris.some((registered) => redirectUriMatches(redirectUri!, registered));
    const prefixes = oauthProvider.clientsStore.getPrefixes(clientId);
    const prefixOk = prefixes.some((prefix) => {
      try {
        return new URL(redirectUri!).origin === new URL(prefix).origin && redirectUri!.startsWith(prefix);
      } catch {
        return false;
      }
    });
    if (!exactOk && !prefixOk) {
      res.status(400).json({ error: "invalid_request", error_description: "Unregistered redirect_uri" });
      return;
    }
  }

  const responseType = params.response_type;
  const codeChallenge = params.code_challenge;
  const codeChallengeMethod = params.code_challenge_method;

  if (responseType !== "code") {
    redirectWithError(res, redirectUri, "unsupported_response_type", "response_type must be 'code'", params.state);
    return;
  }
  if (!codeChallenge || typeof codeChallenge !== "string") {
    redirectWithError(res, redirectUri, "invalid_request", "code_challenge is required", params.state);
    return;
  }
  if (codeChallengeMethod !== "S256") {
    redirectWithError(res, redirectUri, "invalid_request", "code_challenge_method must be 'S256'", params.state);
    return;
  }

  const scope = typeof params.scope === "string" ? params.scope : undefined;
  const state = typeof params.state === "string" ? params.state : undefined;
  const resource = typeof params.resource === "string" ? params.resource : undefined;
  if (resource !== undefined && !URL.canParse(resource)) {
    redirectWithError(res, redirectUri, "invalid_request", "resource must be a valid URL", state);
    return;
  }

  try {
    await oauthProvider.authorize(
      client,
      {
        state,
        scopes: scope ? scope.split(" ").filter(Boolean) : [],
        redirectUri,
        codeChallenge,
        resource: resource ? new URL(resource) : undefined,
      },
      res,
    );
  } catch (err) {
    console.error("[oauth] custom /authorize failed:", (err as Error).message);
    if (!res.headersSent) {
      redirectWithError(res, redirectUri, "server_error", "internal error", state);
    }
  }
});

app.use(
  mcpAuthRouter({
    provider: oauthProvider,
    issuerUrl,
    resourceServerUrl: mcpResourceUrl,
    resourceName: "Propalt MCP",
  }),
);

app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[oauth] unhandled error:", err.message, err.stack);
  if (!res.headersSent) {
    res.status(500).json({ error: "internal_error", message: err.message });
    return;
  }
  next(err);
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

const auth = dualAuth({
  legacyToken: MCP_BEARER_TOKEN,
  verifier: oauthProvider,
  resourceMetadataUrl,
});

app.post("/mcp", auth, async (req, res) => {
  const server = createMcpServer(api);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request failed:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "internal error" });
    }
  }
});

app.get("/mcp", auth, (_req, res) => {
  res.status(405).json({ error: "method not allowed (stateless server)" });
});
app.delete("/mcp", auth, (_req, res) => {
  res.status(405).json({ error: "method not allowed (stateless server)" });
});

const port = Number.parseInt(PORT, 10);
app.listen(port, () => {
  console.log(`gpt-mcp listening on :${port} (POST /mcp, issuer=${issuerUrl.toString()})`);
});

function redirectWithError(
  res: express.Response,
  redirectUri: string | undefined,
  code: string,
  description: string,
  state: string | undefined,
): void {
  if (!redirectUri) {
    res.status(400).json({ error: code, error_description: description });
    return;
  }
  const url = new URL(redirectUri);
  url.searchParams.set("error", code);
  url.searchParams.set("error_description", description);
  if (state) url.searchParams.set("state", state);
  res.redirect(url.toString());
}
