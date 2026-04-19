# Issuing OAuth credentials

How to generate `CLIENT_ID` / `CLIENT_SECRET` pairs for each MCP client. Run all commands from the project root.

The CLI script lives at [scripts/issue-client.ts](../scripts/issue-client.ts) and prints two blocks:
- **SEND TO CUSTOMER** — what to email the customer
- **ADD TO MCP_CLIENTS_JSON** — the JSON line to append to the env var

## After every issue

1. Append the printed JSON entry to the `MCP_CLIENTS_JSON` array in your env (Railway for prod, `.env` for local).
2. Restart the server (Railway redeploy / `npm run dev` will auto-reload).
3. Send the customer the `CLIENT_ID`, `CLIENT_SECRET` (if any), and the MCP URL.

To **revoke**: remove the entry from `MCP_CLIENTS_JSON` and restart.

---

## Claude.ai

Confidential client (CLIENT_ID + CLIENT_SECRET). Pre-fills both Claude.ai redirect URIs.

```bash
npm run issue-client -- --name "Customer Name" --type claude
```

Customer setup in Claude.ai → **Settings → Connectors → Add custom connector**:
- **Name**: `Propalt`
- **URL**: `https://<your-host>/mcp`
- **OAuth Client ID**: paste `CLIENT_ID`
- **OAuth Client Secret**: paste `CLIENT_SECRET`

---

## ChatGPT

Public client (CLIENT_ID only, no secret). Allows ChatGPT's per-connector dynamic callback `https://chatgpt.com/connector/oauth/{id}` via host-locked prefix match.

```bash
npm run issue-client -- --name "Customer Name" --type chatgpt
```

Customer setup in ChatGPT → **Settings → Connectors → Developer Mode → Create**:
- **URL**: `https://<your-host>/mcp`
- **Authentication**: `OAuth`
- **Advanced → Client registration**: `User-defined OAuth Client`
- **OAuth Client ID**: paste `CLIENT_ID`
- **OAuth Client Secret**: leave blank
- **Token endpoint authentication method**: `none`

---

## MCP Inspector (local development)

Confidential client with `http://localhost:6274/oauth/callback` baked in.

```bash
npm run issue-client -- --name "Local Test" --type local
```

Add the JSON entry to your local `.env`:

```
MCP_CLIENTS_JSON='[{"client_id":"...","client_name":"Local Test","redirect_uris":["http://localhost:6274/oauth/callback"],"token_endpoint_auth_method":"client_secret_post","client_secret":"..."}]'
```

Then:

```bash
npm run dev               # loads .env automatically
npx @modelcontextprotocol/inspector
```

In the Inspector UI (`http://localhost:6274`):
- **Transport**: `Streamable HTTP`
- **URL**: `http://localhost:3000/mcp`
- **Auth**: `OAuth` (Inspector auto-discovers `/authorize` and `/token`)
- **Client ID**: paste `CLIENT_ID`
- **Client Secret**: paste `CLIENT_SECRET`

---

## Custom (other MCP clients)

For any other client, supply the redirect URI explicitly. Defaults to confidential (with secret).

```bash
# Confidential client with custom callback
npm run issue-client -- --name "Custom App" --type confidential --redirect-uri https://app.example.com/oauth/callback

# Public (PKCE-only) client
npm run issue-client -- --name "Mobile App" --type public --redirect-uri myapp://oauth/callback
```

`--redirect-uri` can be repeated to allow multiple callbacks for one client.

---

## Reference: type defaults

| `--type` | Secret? | Default redirect_uris | Default redirect_uri_prefixes |
|---|---|---|---|
| `claude` | yes | `https://claude.ai/api/mcp/auth_callback`, `https://claude.com/api/mcp/auth_callback` | — |
| `chatgpt` | no | — | `https://chatgpt.com/connector/oauth/` |
| `local` | yes | `http://localhost:6274/oauth/callback` | — |
| `confidential` | yes | — (use `--redirect-uri`) | — |
| `public` | no | — (use `--redirect-uri`) | — |

`--redirect-uri` values are **appended** to whatever the type provides.
