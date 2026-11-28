import type { HomepageContent, HomepageSource } from "./homepage-source.js";

const CDN_BY_REGION: Record<string, string> = {
  na: "https://cdn.contentstack.io",
  eu: "https://eu-cdn.contentstack.com",
  au: "https://au-cdn.contentstack.com",
  "azure-na": "https://azure-na-cdn.contentstack.com",
  "azure-eu": "https://azure-eu-cdn.contentstack.com",
  "gcp-na": "https://gcp-na-cdn.contentstack.com",
  "gcp-eu": "https://gcp-eu-cdn.contentstack.com",
};

export type ContentstackHomepageConfig = {
  apiKey: string;
  deliveryToken: string;
  environment: string;
  /** Contentstack region. Defaults to North America (`na`). */
  region?: string;
  fetchImpl?: typeof fetch;
};

export function createContentstackHomepageSource(
  config: ContentstackHomepageConfig,
): HomepageSource {
  const fetchImpl = config.fetchImpl ?? fetch;
  const cdn = CDN_BY_REGION[config.region ?? "na"];
  if (!cdn) {
    throw new Error(
      `Unknown Contentstack region "${config.region}". Expected one of: ${Object.keys(CDN_BY_REGION).join(", ")}`,
    );
  }

  return {
    async getHomepage(): Promise<HomepageContent | null> {
      const url = new URL("/v3/content_types/homepage/entries", cdn);
      url.searchParams.set("environment", config.environment);
      url.searchParams.set("limit", "1");

      const response = await fetchImpl(url, {
        headers: {
          api_key: config.apiKey,
          access_token: config.deliveryToken,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Contentstack homepage request failed with status ${response.status}`,
        );
      }

      const payload = (await response.json()) as {
        entries?: Array<Record<string, unknown>>;
      };
      const entry = payload.entries?.[0];
      if (!entry) {
        return null;
      }

      return {
        headline: typeof entry.headline === "string" ? entry.headline : "",
        body: typeof entry.body === "string" ? entry.body : "",
        imageUrl: readImageUrl(entry.image),
      };
    },
  };
}

function readImageUrl(image: unknown): string | null {
  if (!image || typeof image !== "object" || !("url" in image)) {
    return null;
  }

  return typeof image.url === "string" ? image.url : null;
}
