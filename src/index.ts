import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ApiClient } from "./api-client.js";
import { createMcpServer } from "./server.js";
import { bearerAuth } from "./auth.js";

const {
  MCP_BEARER_TOKEN,
  API_BASE_URL,
  API_KEY,
  PORT = "3000",
} = process.env;

if (!MCP_BEARER_TOKEN) throw new Error("MCP_BEARER_TOKEN env var is required");
if (!API_BASE_URL) throw new Error("API_BASE_URL env var is required");
if (!API_KEY) throw new Error("API_KEY env var is required");

const api = new ApiClient(API_BASE_URL, API_KEY);

const app = express();
app.use(express.json({ limit: "4mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

const auth = bearerAuth(MCP_BEARER_TOKEN);

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

// Stateless mode: reject session-based GET/DELETE on /mcp
app.get("/mcp", auth, (_req, res) => {
  res.status(405).json({ error: "method not allowed (stateless server)" });
});
app.delete("/mcp", auth, (_req, res) => {
  res.status(405).json({ error: "method not allowed (stateless server)" });
});

const port = Number.parseInt(PORT, 10);
app.listen(port, () => {
  console.log(`gpt-mcp listening on :${port} (POST /mcp)`);
});
