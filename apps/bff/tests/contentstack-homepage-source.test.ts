import { describe, expect, it } from "vitest";
import { createContentstackHomepageSource } from "../src/contentstack-homepage-source.js";

const API_KEY = "stack-api-key";
const DELIVERY_TOKEN = "delivery-token";

describe("Contentstack Homepage adapter", () => {
  it("reads the published homepage entry from the Delivery API", async () => {
    const requests: Array<{ url: string; apiKey: string | null; accessToken: string | null }> =
      [];

    const source = createContentstackHomepageSource({
      apiKey: API_KEY,
      deliveryToken: DELIVERY_TOKEN,
      environment: "production",
      fetchImpl: async (input, init) => {
        const headers = new Headers(init?.headers);
        requests.push({
          url: String(input),
          apiKey: headers.get("api_key"),
          accessToken: headers.get("access_token"),
        });

        return new Response(
          JSON.stringify({
            entries: [
              {
                title: "Homepage",
                headline: "Winter edit",
                body: "A short note from the studio.",
                image: {
                  url: "https://images.contentstack.io/v3/assets/hero.jpg",
                },
                product_reference: [{ uid: "product-1" }],
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    });

    await expect(source.getHomepage()).resolves.toEqual({
      headline: "Winter edit",
      body: "A short note from the studio.",
      imageUrl: "https://images.contentstack.io/v3/assets/hero.jpg",
    });

    expect(requests).toEqual([
      {
        url: "https://cdn.contentstack.io/v3/content_types/homepage/entries?environment=production&limit=1",
        apiKey: API_KEY,
        accessToken: DELIVERY_TOKEN,
      },
    ]);
  });

  it("returns no Homepage when Contentstack has no published entry", async () => {
    const source = createContentstackHomepageSource({
      apiKey: API_KEY,
      deliveryToken: DELIVERY_TOKEN,
      environment: "production",
      fetchImpl: async () =>
        new Response(JSON.stringify({ entries: [] }), { status: 200 }),
    });

    await expect(source.getHomepage()).resolves.toBeNull();
  });

  it("returns no image when the Homepage entry has no file", async () => {
    const source = createContentstackHomepageSource({
      apiKey: API_KEY,
      deliveryToken: DELIVERY_TOKEN,
      environment: "production",
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            entries: [
              {
                headline: "Winter edit",
                body: "A short note from the studio.",
                image: null,
              },
            ],
          }),
          { status: 200 },
        ),
    });

    await expect(source.getHomepage()).resolves.toEqual({
      headline: "Winter edit",
      body: "A short note from the studio.",
      imageUrl: null,
    });
  });

  it("fails when Contentstack rejects the request", async () => {
    const source = createContentstackHomepageSource({
      apiKey: API_KEY,
      deliveryToken: DELIVERY_TOKEN,
      environment: "production",
      fetchImpl: async () => new Response("unauthorized", { status: 401 }),
    });

    await expect(source.getHomepage()).rejects.toThrow(
      "Contentstack homepage request failed with status 401",
    );
  });

  it("calls the Europe Delivery API when the region is eu", async () => {
    let url = "";
    const source = createContentstackHomepageSource({
      apiKey: API_KEY,
      deliveryToken: DELIVERY_TOKEN,
      environment: "production",
      region: "eu",
      fetchImpl: async (input) => {
        url = String(input);
        return new Response(JSON.stringify({ entries: [] }), { status: 200 });
      },
    });

    await source.getHomepage();

    expect(url).toBe(
      "https://eu-cdn.contentstack.com/v3/content_types/homepage/entries?environment=production&limit=1",
    );
  });
});
