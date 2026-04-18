import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  getOAuthProtectedResourceMetadataUrl,
  mcpAuthRouter,
} from "@modelcontextprotocol/sdk/server/auth/router.js";
import { ApiClient } from "./api-client.js";
import { createMcpServer } from "./server.js";
import { dualAuth } from "./auth.js";
import { createOAuthProvider } from "./oauth/index.js";

const {
  MCP_BEARER_TOKEN,
  API_BASE_URL,
  API_KEY,
  PUBLIC_BASE_URL,
  PORT = "3000",
} = process.env;

if (!API_BASE_URL) throw new Error("API_BASE_URL env var is required");
if (!API_KEY) throw new Error("API_KEY env var is required");
if (!PUBLIC_BASE_URL) throw new Error("PUBLIC_BASE_URL env var is required");

const api = new ApiClient(API_BASE_URL, API_KEY);
const oauthProvider = createOAuthProvider();
const issuerUrl = new URL(PUBLIC_BASE_URL);
const mcpResourceUrl = new URL("/mcp", issuerUrl);
const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(mcpResourceUrl);

const app = express();
// Railway (and most PaaS) puts a reverse proxy in front of the app. Telling Express
// to trust a single proxy hop lets express-rate-limit (used by the MCP auth router)
// derive the real client IP from X-Forwarded-For instead of throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set("trust proxy", 1);
app.use(express.json({ limit: "4mb" }));

// Diagnostic: log every /token request's shape BEFORE the SDK handles it, and
// capture any response status the SDK produces. This lets us see exactly what
// ChatGPT is sending and what we're returning when 400s happen.
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

app.use(
  mcpAuthRouter({
    provider: oauthProvider,
    issuerUrl,
    resourceServerUrl: mcpResourceUrl,
    resourceName: "Propalt MCP",
  }),
);

// Global error logger — catches anything thrown synchronously during request handling.
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
