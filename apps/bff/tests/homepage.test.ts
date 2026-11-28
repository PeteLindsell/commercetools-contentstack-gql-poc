import { describe, expect, it } from "vitest";
import { createBffApp } from "../src/create-app.js";
import type { HomepageSource } from "../src/homepage-source.js";

const SHARED_SECRET = "test-shared-secret";

const HOMEPAGE_QUERY = /* GraphQL */ `
  query Homepage {
    homepage {
      headline
      body
      imageUrl
    }
  }
`;

async function queryHomepage(homepageSource: HomepageSource) {
  const yoga = createBffApp({
    sharedSecret: SHARED_SECRET,
    homepageSource,
  });

  const response = await yoga.fetch("http://localhost/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-bff-shared-secret": SHARED_SECRET,
    },
    body: JSON.stringify({ query: HOMEPAGE_QUERY }),
  });

  expect(response.status).toBe(200);
  return response.json();
}

describe("Homepage query", () => {
  it("returns the Homepage headline, body, and image from Contentstack", async () => {
    const contentstack: HomepageSource = {
      async getHomepage() {
        return {
          headline: "Winter edit",
          body: "A short note from the studio.",
          imageUrl: "https://images.example.test/hero.jpg",
        };
      },
    };

    await expect(queryHomepage(contentstack)).resolves.toEqual({
      data: {
        homepage: {
          headline: "Winter edit",
          body: "A short note from the studio.",
          imageUrl: "https://images.example.test/hero.jpg",
        },
      },
    });
  });

  it("returns no Homepage when Contentstack has no entry", async () => {
    const contentstack: HomepageSource = {
      async getHomepage() {
        return null;
      },
    };

    await expect(queryHomepage(contentstack)).resolves.toEqual({
      data: {
        homepage: null,
      },
    });
  });

  it("returns no Homepage when the entry headline and body are blank", async () => {
    const contentstack: HomepageSource = {
      async getHomepage() {
        return {
          headline: "  ",
          body: "\n",
          imageUrl: "https://images.example.test/unused.jpg",
        };
      },
    };

    await expect(queryHomepage(contentstack)).resolves.toEqual({
      data: {
        homepage: null,
      },
    });
  });

  it("returns a Homepage without an image when Contentstack has none", async () => {
    const contentstack: HomepageSource = {
      async getHomepage() {
        return {
          headline: "Winter edit",
          body: "A short note from the studio.",
          imageUrl: "   ",
        };
      },
    };

    await expect(queryHomepage(contentstack)).resolves.toEqual({
      data: {
        homepage: {
          headline: "Winter edit",
          body: "A short note from the studio.",
          imageUrl: null,
        },
      },
    });
  });

  it("exposes only editorial fields on Homepage", async () => {
    const yoga = createBffApp({
      sharedSecret: SHARED_SECRET,
      homepageSource: {
        async getHomepage() {
          return {
            headline: "Winter edit",
            body: "A short note from the studio.",
            imageUrl: null,
          };
        },
      },
    });

    const response = await yoga.fetch("http://localhost/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-bff-shared-secret": SHARED_SECRET,
      },
      body: JSON.stringify({
        query: /* GraphQL */ `
          query HomepageFields {
            __type(name: "Homepage") {
              fields {
                name
              }
            }
          }
        `,
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        __type: {
          fields: [
            { name: "headline" },
            { name: "body" },
            { name: "imageUrl" },
          ],
        },
      },
    });
  });

  it("reports that the Homepage source is not configured", async () => {
    const yoga = createBffApp({ sharedSecret: SHARED_SECRET });

    const response = await yoga.fetch("http://localhost/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-bff-shared-secret": SHARED_SECRET,
      },
      body: JSON.stringify({ query: HOMEPAGE_QUERY }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: { homepage: null },
      errors: [{ message: "Homepage source is not configured" }],
    });
  });
});
