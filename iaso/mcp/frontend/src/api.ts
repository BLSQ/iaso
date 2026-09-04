export type JsonSchemaProperty = {
  type?: string;
  description?: string;
  items?: { type?: string };
};

export type ToolInputSchema = {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
};

export type Tool = {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
};

export type ToolsResponse = {
  server_name: string;
  server_version: string;
  protocol_version: string;
  tools: Tool[];
};

export type Whoami = {
  ok: boolean;
  login: string;
  base_url: string;
  account_id: number | string | null;
  account_name: string;
  user_full_name: string;
};

function cookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[$()*+.?[\\\]^{|}]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      detail?: string;
      error?: string;
      message?: string;
    };
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.error === "string") return data.error;
    if (typeof data.message === "string") return data.message;
  } catch {
    /* not JSON */
  }
  return res.statusText || `HTTP ${res.status}`;
}

export async function fetchCsrf(): Promise<string> {
  await fetch("/mcp/me/", { credentials: "include" });
  return cookie("csrftoken") || "";
}

export async function getTools(): Promise<ToolsResponse> {
  const res = await fetch("/mcp/tools.json", { credentials: "include" });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<ToolsResponse>;
}

export async function getMe(): Promise<Whoami | null> {
  const res = await fetch("/mcp/me/", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Whoami>;
}

export async function logout(): Promise<void> {
  const csrf = await fetchCsrf();
  const res = await fetch("/logout-iaso", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrf,
    },
    body: "{}",
  });
  if (!res.ok && res.status !== 204) throw new Error(await parseError(res));
}

export function mcpUrl(): string {
  const configured = import.meta.env.VITE_MCP_PUBLIC_URL as string | undefined;
  if (configured) return configured;
  if (window.location.port === "5173") {
    return `${window.location.protocol}//${window.location.hostname}:8081/mcp/`;
  }
  return `${window.location.origin}/mcp/`;
}

export function catalogHome(): string {
  if (window.location.pathname.startsWith("/mcp/app")) {
    return "/mcp/app/";
  }
  return "/mcp/";
}

export function iasoLoginUrl(next = catalogHome()): string {
  return `/login/?next=${encodeURIComponent(next)}`;
}
