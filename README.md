# gpt-mcp

Remote MCP server that exposes `search` and `fetch` tools to ChatGPT deep research. Wraps the **Propalt middlelayer API** (UK property data — address lookup + full property records) behind a bearer-token-protected Streamable HTTP endpoint and is designed to deploy on Railway.

## Stack

- Node 20+, TypeScript (ESM)
- `@modelcontextprotocol/sdk` — Streamable HTTP transport
- Express for HTTP routing + bearer-token auth
- Zod for tool input validation

## Local development

```bash
npm install
cp .env.example .env
# edit .env: set MCP_BEARER_TOKEN, API_BASE_URL, API_KEY
npm run dev
```

Health check: `curl http://localhost:3000/health` → `{"ok":true}`

Test the MCP endpoint with the official inspector:

```bash
npx @modelcontextprotocol/inspector
```

Point it at `http://localhost:3000/mcp` and add header `Authorization: Bearer <MCP_BEARER_TOKEN>`. Call `search` then `fetch` to verify.

## Deploy to Railway

1. Push the repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo**.
3. Set environment variables in the service:
   - `MCP_BEARER_TOKEN` (generate a long random string)
   - `API_BASE_URL`
   - `API_KEY`
4. Railway auto-detects Node via Nixpacks. `railway.json` pins the build/start commands and wires `/health` as the healthcheck.
5. After deploy, Railway gives you `https://<name>.up.railway.app`. Your MCP URL is `https://<name>.up.railway.app/mcp`.

## Connect to ChatGPT

1. ChatGPT → **Settings → Connectors → Developer Mode → Create**.
2. URL: `https://<name>.up.railway.app/mcp`
3. Authentication: **Bearer**, paste `MCP_BEARER_TOKEN`.
4. Start a deep-research chat. ChatGPT will call `search` and then `fetch` on returned ids.

## Upstream API

All Propalt-specific logic lives in [src/api-client.ts](src/api-client.ts):

- `search(query)` → `GET /middlelayer/addresses/lookup?keyword=...`, returns up to 10 address matches
- `fetch(id)` → `GET /middlelayer/property/{id}`, returns a human-readable property summary with the full raw record in `metadata`

To point this server at a different upstream, edit `api-client.ts` only — the MCP server, tool handlers, and HTTP layer stay untouched.
