const UPSTREAM_TIMEOUT_MS = 10_000;

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  query?: QueryParams;
  body?: unknown;
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {
    if (!baseUrl) throw new Error("API_BASE_URL is required");
    if (!apiKey) throw new Error("PROPALT_API_KEY is required");
  }

  async request(
    method: "GET" | "POST",
    path: string,
    opts: RequestOptions = {},
  ): Promise<unknown> {
    const url = new URL(path, this.baseUrl);
    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v === undefined || v === null) continue;
        url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };
    let body: string | undefined;
    if (method === "POST") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body ?? {});
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, { method, headers, body, signal: controller.signal });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new Error(`Upstream timeout after ${UPSTREAM_TIMEOUT_MS}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const snippet = (await res.text().catch(() => "")).slice(0, 500);
      const err = new UpstreamError(res.status, res.statusText, snippet);
      console.error("[upstream] error", {
        status: res.status,
        statusText: res.statusText,
        path,
        body: snippet,
      });
      throw err;
    }

    return (await res.json()) as unknown;
  }
}

export class UpstreamError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly upstreamBody: string;
  constructor(status: number, statusText: string, upstreamBody: string) {
    super(`Upstream ${status} ${statusText}`);
    this.name = "UpstreamError";
    this.status = status;
    this.statusText = statusText;
    this.upstreamBody = upstreamBody;
  }
}
