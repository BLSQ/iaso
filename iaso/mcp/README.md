# IASO MCP

MCP (Model Context Protocol) is a Django app on this IASO process, following
[OpenHEXA](https://github.com/BLSQ/openhexa-app) (`hexa.mcp` + `hexa.oauth`):

- JSON-RPC at `/mcp` (WSGI, no FastMCP / ASGI)
- OAuth 2.1 + PKCE + DCR at `/oauth/` and `/.well-known/`
- Tools run **in-process** as the logged-in IASO user (same DRF permissions)
- Catalog UI: same public URL as the protocol (`/mcp/`). Browsers (`Accept: text/html`)
  get the SPA; MCP clients get JSON. `/mcp/tools.json` is always JSON.

This is a **core** app (`iaso.mcp`), not a plugin. Do not add `mcp` to
`PLUGINS=`. `docker-compose.yml` sets `MCP_ENABLED=true` on the iaso
service so `/mcp` is on with `docker compose up`. Production must set
`MCP_ENABLED=true` explicitly (default is off when `DEBUG=false`).

## Run

`docker compose up` starts Django (`:8081`) and `mcp-ui` (`:5173`).

- Catalog (browser): `http://127.0.0.1:8081/mcp/`
- Protocol (Cursor / Claude): `http://127.0.0.1:8081/mcp/` (POST JSON-RPC)
- Vite hot-reload: `http://127.0.0.1:5173/mcp/app/` (DEBUG redirects `/mcp/` here if the SPA is not built)
- Log in at IASO `/login/`, then Cursor **Connect** / Gemini `/mcp auth`

## Security (review before merge — this is a public repo)

- **No stored remote tokens.** The old `IasoConnection` / login-token store is gone.
- **Bearer only on `/mcp` POST.** Session cookies are rejected on the JSON-RPC
  endpoint (`csrf_exempt` + cookie auth would be CSRF). Catalog `/mcp/me/` is GET + session.
- **OAuth DCR allowlist + rate limit.** Redirect hosts/schemes are fixed
  (loopback, Cursor, Claude, ChatGPT). `POST /register` is capped per IP
  (`MCP_DCR_RATE_LIMIT`, default 10/hour).
- **Path jail.** Excel tools only read/write `MEDIA_ROOT/mcp/` and the packaged
  sample workbook. `..`, `/etc/passwd`, `~/Downloads`, and `file:` escapes are rejected.
- **Writes still need `confirm=true`.** Tools use the user's existing IASO permissions.
- **Pyramid apply uses the session account.** Source, version, and project come
  from `profiles/me/`, not hardcoded QA IDs.
- **Production:** set `MCP_ENABLED=true` explicitly. Default is off when `DEBUG=false`.
- **Do not log secrets.** `ToolCall` stores tool names and sanitized args
  (`xlsx_base64`, tokens, passwords, and `json_body` are redacted).

## Tests

```bash
docker compose run --rm iaso manage test iaso.mcp
```
