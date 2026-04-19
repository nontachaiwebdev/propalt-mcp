# gpt-mcp

Remote MCP server that exposes the full **Propalt API** (UK property data — 24 endpoints covering address lookup, property details, comparables, valuations, market analytics, audiences, and more) as MCP tools for Claude.ai, ChatGPT, and other MCP clients. Ships with OAuth 2.1 (pre-issued credentials per customer) plus optional static-bearer auth. Designed to deploy on Railway.

## Stack

- Node 20+, TypeScript (ESM)
- `@modelcontextprotocol/sdk` — Streamable HTTP transport + OAuth 2.1 primitives
- Express for HTTP routing
- Zod for tool input validation

## Auth model

Two auth paths co-exist:

1. **OAuth 2.1 with pre-issued credentials** — you mint a `CLIENT_ID` (and optionally `CLIENT_SECRET`) per customer with `npm run issue-client`, paste the JSON entry into `MCP_CLIENTS_JSON`, then send the credentials to the customer to enter in their connector setup ("User-defined OAuth Client" mode). Dynamic Client Registration is **disabled** — `/register` returns 404.
2. **Static bearer** (legacy) — if `MCP_BEARER_TOKEN` is set, a request presenting that token bypasses OAuth.

OAuth tokens are stored **in memory**; a Railway redeploy invalidates active sessions but client credentials live in `MCP_CLIENTS_JSON` so customers reconnect with the same credentials.

## Env vars

| Var | Required | Purpose |
|---|---|---|
| `API_BASE_URL` | yes | Propalt API base, e.g. `https://api.propalt.io` |
| `PROPALT_API_KEY` | yes | Bearer token for the upstream Propalt API |
| `PUBLIC_BASE_URL` | yes | Public HTTPS base URL of this MCP server, no trailing slash |
| `MCP_CLIENTS_JSON` | one of | JSON array of pre-issued client entries (see below) |
| `MCP_CLIENTS_FILE` | one of | Path to a JSON file with the same shape — alternative to `MCP_CLIENTS_JSON` |
| `MCP_BEARER_TOKEN` | one of | Static bearer token (legacy escape hatch) |
| `PORT` | no | Defaults to `3000` |

The server refuses to boot unless at least one of `MCP_CLIENTS_JSON` / `MCP_CLIENTS_FILE` / `MCP_BEARER_TOKEN` is set.

### `MCP_CLIENTS_JSON` shape

```json
[
  {
    "client_id": "propalt-acme-a1b2c3d4",
    "client_secret": "<32-byte-base64url>",
    "client_name": "Acme (Claude.ai)",
    "redirect_uris": [
      "https://claude.ai/api/mcp/auth_callback",
      "https://claude.com/api/mcp/auth_callback"
    ],
    "token_endpoint_auth_method": "client_secret_post"
  },
  {
    "client_id": "propalt-beta-e5f6g7h8",
    "client_name": "Beta (ChatGPT)",
    "redirect_uri_prefixes": ["https://chatgpt.com/connector/oauth/"],
    "token_endpoint_auth_method": "none"
  }
]
```

- `client_secret` — required when `token_endpoint_auth_method` is `client_secret_post`; omit for public (`none`) clients.
- `redirect_uris` — exact-match URIs (per OAuth 2.1).
- `redirect_uri_prefixes` — host-locked prefix match (origin must equal). Used for ChatGPT's per-connector dynamic callback `https://chatgpt.com/connector/oauth/{id}`.
- `token_endpoint_auth_method` — `client_secret_post` (default) or `none` (PKCE-only public client).

## Issuing customer credentials

Use the CLI generator — it creates a random `client_id` and `client_secret`, applies sensible defaults per client type, and prints (a) the values to send to the customer and (b) the JSON line to paste into `MCP_CLIENTS_JSON`.

```bash
# Claude.ai customer (confidential client + secret)
npm run issue-client -- --name "Acme Corp" --type claude

# ChatGPT customer (public client, PKCE only, no secret)
npm run issue-client -- --name "Acme Corp" --type chatgpt

# Custom redirect URI
npm run issue-client -- --name "Local test" --type confidential --redirect-uri http://localhost:6274/oauth/callback
```

After issuing:
1. Append the printed JSON entry to the `MCP_CLIENTS_JSON` array in Railway.
2. Redeploy (Railway picks up env-var changes via redeploy).
3. Send the customer their `CLIENT_ID`, `CLIENT_SECRET` (if any), and the MCP URL.

To revoke a customer: remove their entry from `MCP_CLIENTS_JSON` and redeploy.

## Local development

```bash
npm install
cp .env.example .env
# fill PUBLIC_BASE_URL (http://localhost:3000), API_BASE_URL, PROPALT_API_KEY
# add MCP_CLIENTS_JSON='[{...}]' or MCP_BEARER_TOKEN
npm run dev
```

Health check: `curl http://localhost:3000/health` → `{"ok":true}`

Test MCP with the official inspector:

```bash
npx @modelcontextprotocol/inspector
```

Point it at `http://localhost:3000/mcp`.

## Deploy to Railway

1. Push the repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo**.
3. Set environment variables (see table above).
4. Railway auto-detects Node via Nixpacks; `railway.json` pins build/start and `/health`.
5. MCP URL: `https://<name>.up.railway.app/mcp`

## Connect from Claude.ai (OAuth)

1. Generate credentials: `npm run issue-client -- --name "Customer" --type claude`
2. Add the printed JSON entry to `MCP_CLIENTS_JSON` in Railway, redeploy.
3. Send the customer the MCP URL, `CLIENT_ID`, and `CLIENT_SECRET`.
4. Customer in Claude.ai → **Settings → Connectors → Add custom connector**:
   - Name: `Propalt`
   - URL: `https://<name>.up.railway.app/mcp`
   - **OAuth Client ID**: paste the `CLIENT_ID`
   - **OAuth Client Secret**: paste the `CLIENT_SECRET`
5. Add → Claude.ai walks `/authorize` → `/token` → tools appear.

## Connect from ChatGPT (OAuth)

1. Generate credentials: `npm run issue-client -- --name "Customer" --type chatgpt`
2. Add the printed JSON entry to `MCP_CLIENTS_JSON` in Railway, redeploy.
3. Send the customer the MCP URL and `CLIENT_ID` (no secret for ChatGPT public clients).
4. Customer in ChatGPT → **Settings → Connectors → Developer Mode → Create**:
   - URL: `https://<name>.up.railway.app/mcp`
   - Authentication: **OAuth**
   - Advanced → **User-defined OAuth Client** (วิธีการลงทะเบียน → ไคลเอนต์ OAuth ที่ผู้ใช้กำหนด)
   - **OAuth Client ID**: paste the `CLIENT_ID`
   - **OAuth Client Secret**: leave blank
   - **Token endpoint authentication method**: `none`
5. Add → ChatGPT walks `/authorize` (its dynamic `https://chatgpt.com/connector/oauth/{id}` callback matches our prefix allowlist) → `/token` with PKCE → tools appear.

## Connect from ChatGPT (legacy static bearer)

If you'd rather hand a customer a single bearer token instead of OAuth:

1. Set `MCP_BEARER_TOKEN` in Railway.
2. ChatGPT → **Settings → Connectors → Developer Mode → Create**.
3. URL: `https://<name>.up.railway.app/mcp`
4. Authentication: **Bearer**, paste your `MCP_BEARER_TOKEN`.

## Upstream API

The server wraps 24 endpoints from the Propalt API at `https://api.propalt.io` — see [api.json](api.json) for the full OpenAPI spec. Each endpoint is exposed as an individual MCP tool under [src/tools/](src/tools/).

[src/api-client.ts](src/api-client.ts) exposes a single generic `request(method, path, { query, body })` method that handles `Authorization: Bearer <PROPALT_API_KEY>`, a 10s timeout, and upstream error formatting. Each tool calls it with a hard-coded method + path.

To point this server at a different upstream base, change `API_BASE_URL` — the tool files and auth layer stay untouched.

## File layout

```
src/
├── index.ts                 Express app: /health, /mcp, custom /authorize, mounts mcpAuthRouter
├── server.ts                MCP server factory: registers all 24 Propalt tools
├── auth.ts                  dualAuth middleware (legacy bearer OR OAuth token)
├── api-client.ts            Generic Propalt REST client (one request() method)
├── tools/                   One file per endpoint (24 tools)
└── oauth/
    ├── index.ts             createOAuthProvider() + loadClientEntries()
    ├── client-entries.ts    Zod schema + env loader for MCP_CLIENTS_JSON / FILE
    ├── clients-store.ts     StaticClientsStore (no DCR; pre-issued only)
    ├── provider.ts          OAuthServerProvider implementation
    └── store.ts             In-memory stores for codes, access tokens, refresh tokens
scripts/
└── issue-client.ts          CLI: mint a CLIENT_ID/CLIENT_SECRET pair
```
