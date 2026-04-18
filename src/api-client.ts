export interface SearchResult {
  id: string;
  title: string;
  text: string;
  url?: string;
}

export interface FetchResult {
  id: string;
  title: string;
  text: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

interface PropaltEnvelope<T> {
  status: string;
  data: T;
}

interface PropaltSearchItem {
  type: string;
  text: string;
  property_id: string;
  lat?: number;
  lng?: number;
}

interface PropaltProperty {
  id: number | string;
  address_text?: string | null;
  number_of_bedrooms?: number | null;
  number_of_bathrooms?: number | null;
  number_of_reception_rooms?: number | null;
  property_type?: string | null;
  built_from?: string | null;
  class_description?: string | null;
  approx_size?: number | null;
  plot_size?: number | null;
  tenure?: string | null;
  construction_age_band_std?: string | null;
  current_energy_rating?: string | null;
  tax_band?: string | null;
  avm?: number | null;
  uprn?: number | string | null;
  title_number_list?: string | null;
  town?: string | null;
  postcode?: string | null;
  country?: string | null;
  thoroughfare?: string | null;
  building_number?: number | string | null;
  lat?: number | null;
  lng?: number | null;
  [key: string]: unknown;
}

const SEARCH_RESULT_LIMIT = 10;
const UPSTREAM_TIMEOUT_MS = 10_000;

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {
    if (!baseUrl) throw new Error("API_BASE_URL is required");
    if (!apiKey) throw new Error("API_KEY is required");
  }

  async search(query: string): Promise<SearchResult[]> {
    const url = new URL("/middlelayer/addresses/lookup", this.baseUrl);
    url.searchParams.set("keyword", query);

    const body = await this.request<PropaltEnvelope<PropaltSearchItem[]>>(url);

    if (!Array.isArray(body.data)) return [];

    return body.data.slice(0, SEARCH_RESULT_LIMIT).map((item) => ({
      id: String(item.property_id),
      title: item.text,
      text: coordSnippet(item.text, item.lat, item.lng),
    }));
  }

  async fetch(id: string): Promise<FetchResult> {
    const url = new URL(
      `/middlelayer/property/${encodeURIComponent(id)}`,
      this.baseUrl,
    );

    const body = await this.request<PropaltEnvelope<PropaltProperty>>(url);
    const p = body.data;

    return {
      id: String(p.id ?? id),
      title: p.address_text?.trim() || `Property ${id}`,
      text: formatPropertySummary(p),
      metadata: p as unknown as Record<string, unknown>,
    };
  }

  private async request<T>(url: URL): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new Error(`Upstream timeout after ${UPSTREAM_TIMEOUT_MS}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const snippet = (await res.text().catch(() => "")).slice(0, 200);
      throw new Error(`Upstream ${res.status} ${res.statusText}: ${snippet}`);
    }

    const body = (await res.json()) as T & { status?: string };
    if (body.status && body.status !== "OK") {
      throw new Error(`Upstream returned status=${body.status}`);
    }
    return body;
  }
}

function coordSnippet(address: string, lat?: number, lng?: number): string {
  if (typeof lat === "number" && typeof lng === "number") {
    return `${address} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
  return address;
}

function formatPropertySummary(p: PropaltProperty): string {
  const lines: string[] = [];

  const header =
    p.address_text?.trim() ||
    [p.building_number, p.thoroughfare, p.town, p.postcode]
      .filter(Boolean)
      .join(" ");
  if (header) {
    lines.push(p.country ? `${header} (${p.country})` : header);
    lines.push("");
  }

  const kind = [p.class_description || p.built_from, p.property_type]
    .filter(Boolean)
    .join(" ");
  if (kind) lines.push(`Type: ${kind}`);

  const rooms = [
    p.number_of_bedrooms != null ? `Bedrooms: ${p.number_of_bedrooms}` : null,
    p.number_of_bathrooms != null ? `Bathrooms: ${p.number_of_bathrooms}` : null,
    p.number_of_reception_rooms != null
      ? `Receptions: ${p.number_of_reception_rooms}`
      : null,
  ].filter(Boolean);
  if (rooms.length) lines.push(rooms.join(" · "));

  const size = [
    p.approx_size != null ? `Approx size: ${p.approx_size} sqm` : null,
    p.plot_size != null ? `Plot: ${p.plot_size} sqm` : null,
  ].filter(Boolean);
  if (size.length) lines.push(size.join(" · "));

  const meta = [
    p.tenure ? `Tenure: ${p.tenure}` : null,
    p.construction_age_band_std
      ? `Construction: ${p.construction_age_band_std}`
      : null,
  ].filter(Boolean);
  if (meta.length) lines.push(meta.join(" · "));

  const energy = [
    p.current_energy_rating ? `EPC: ${p.current_energy_rating}` : null,
    p.tax_band ? `Council tax band: ${p.tax_band}` : null,
  ].filter(Boolean);
  if (energy.length) lines.push(energy.join(" · "));

  if (p.avm != null) lines.push(`AVM: £${p.avm.toLocaleString("en-GB")}`);

  const ids = [
    p.uprn != null ? `UPRN: ${p.uprn}` : null,
    p.title_number_list ? `Title: ${p.title_number_list}` : null,
  ].filter(Boolean);
  if (ids.length) lines.push(ids.join(" · "));

  if (typeof p.lat === "number" && typeof p.lng === "number") {
    lines.push(`Coords: ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`);
  }

  return lines.join("\n");
}
