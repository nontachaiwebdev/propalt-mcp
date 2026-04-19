import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(here, "../../widgets/comparable-card.html"), "utf8");

export const COMPARABLE_CARD_URI = "ui://widget/comparable-card.html";

export function registerComparableCardWidget(server: McpServer) {
  server.registerResource(
    "comparable-card",
    COMPARABLE_CARD_URI,
    {
      title: "Comparable Properties Card",
      mimeType: "text/html+skybridge",
    },
    async () => ({
      contents: [
        {
          uri: COMPARABLE_CARD_URI,
          mimeType: "text/html+skybridge",
          text: html,
        },
      ],
    }),
  );
}
