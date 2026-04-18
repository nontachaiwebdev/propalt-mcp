# gpt-mcp

Remote MCP server that exposes the full **Propalt API** (UK property data — 24 endpoints covering address lookup, property details, comparables, valuations, market analytics, audiences, and more) as MCP tools for Claude.ai and other MCP clients. Ships with OAuth 2.1 (for Claude.ai) plus optional static-bearer auth. Designed to deploy on Railway.

## Stack

- Node 20+, TypeScript (ESM)
- `@modelcontextprotocol/sdk` — Streamable HTTP transport + OAuth 2.1 primitives
- Express for HTTP routing
- Zod for tool input validation

## Auth model

Two auth paths co-exist:

1. **OAuth 2.1** (for Claude.ai) — the server is a full OAuth authorization server with Dynamic Client Registration, PKCE, and standard discovery endpoints at `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource`.
2. **Static bearer** (for ChatGPT) — if `MCP_BEARER_TOKEN` is set, a request presenting that token bypasses OAuth. Leave it unset to require OAuth for all clients.

OAuth clients and tokens are stored **in memory**, so a Railway redeploy wipes them. Claude.ai transparently re-registers via DCR, so this is not user-visible.

## Local development

```bash
npm install
cp .env.example .env
# fill in PUBLIC_BASE_URL (http://localhost:3000 for local), API_BASE_URL (https://api.propalt.io), PROPALT_API_KEY
# optional: MCP_BEARER_TOKEN for ChatGPT-style access
npm run dev
```

Health check: `curl http://localhost:3000/health` → `{"ok":true}`

Test the MCP endpoint with the official inspector:

```bash
npx @modelcontextprotocol/inspector
```

Point it at `http://localhost:3000/mcp`. The inspector can drive the full OAuth flow, or you can paste `MCP_BEARER_TOKEN` as a static token.

## Deploy to Railway

1. Push the repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo**.
3. Set environment variables:
   - `PUBLIC_BASE_URL` — `https://<name>.up.railway.app` (no trailing slash)
   - `API_BASE_URL` — `https://api.propalt.io`
   - `PROPALT_API_KEY` — your Propalt bearer token
   - `MCP_BEARER_TOKEN` — *(optional)* static token for ChatGPT
4. Railway auto-detects Node via Nixpacks; `railway.json` pins build/start and `/health`.
5. MCP URL: `https://<name>.up.railway.app/mcp`

## Connect to ChatGPT (static bearer)

1. Set `MCP_BEARER_TOKEN` in Railway.
2. ChatGPT → **Settings → Connectors → Developer Mode → Create**.
3. URL: `https://<name>.up.railway.app/mcp`
4. Authentication: **Bearer**, paste your `MCP_BEARER_TOKEN`.

## Connect to Claude.ai (OAuth)

1. Make sure `PUBLIC_BASE_URL` is set in Railway to the public HTTPS URL.
2. Claude.ai → **Settings → Connectors → Add custom connector**.
3. Name: `Propalt`
4. URL: `https://<name>.up.railway.app/mcp`
5. Leave **OAuth Client ID** and **OAuth Client Secret** blank — the server supports Dynamic Client Registration and Claude.ai will register itself automatically.
6. Add → Claude.ai redirects you through `/authorize` (auto-approves, no consent UI) → returns with a code → exchanges it for a token → tools appear.

## Upstream API

The server wraps 24 endpoints from the Propalt API at `https://api.propalt.io` — see [api.json](api.json) for the full OpenAPI spec. Each endpoint is exposed as an individual MCP tool under [src/tools/](src/tools/).

[src/api-client.ts](src/api-client.ts) exposes a single generic `request(method, path, { query, body })` method that handles `Authorization: Bearer <PROPALT_API_KEY>`, a 10s timeout, and upstream error formatting. Each tool calls it with a hard-coded method + path.

To point this server at a different upstream base, change `API_BASE_URL` — the tool files and auth layer stay untouched.

## File layout

```
src/
├── index.ts            Express app: /health, /mcp, mounts OAuth router
├── server.ts           MCP server factory: registers all 24 Propalt tools
├── auth.ts             dualAuth middleware (legacy bearer OR OAuth token)
├── api-client.ts       Generic Propalt REST client (one request() method)
├── tools/              One file per endpoint (24 tools)
└── oauth/
    ├── index.ts        createOAuthProvider() factory
    ├── provider.ts     OAuthServerProvider implementation
    ├── clients-store.ts In-memory DCR client registry
    └── store.ts        In-memory stores for codes, access tokens, refresh tokens
```
