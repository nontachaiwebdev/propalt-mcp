import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "./api-client.js";
import {
  searchInputSchema,
  searchDescription,
  makeSearchHandler,
} from "./tools/search.js";
import {
  fetchInputSchema,
  fetchDescription,
  makeFetchHandler,
} from "./tools/fetch.js";

export function createMcpServer(api: ApiClient): McpServer {
  const server = new McpServer(
    { name: "gpt-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "search",
    {
      title: "Search",
      description: searchDescription,
      inputSchema: searchInputSchema,
    },
    makeSearchHandler(api),
  );

  server.registerTool(
    "fetch",
    {
      title: "Fetch",
      description: fetchDescription,
      inputSchema: fetchInputSchema,
    },
    makeFetchHandler(api),
  );

  return server;
}
