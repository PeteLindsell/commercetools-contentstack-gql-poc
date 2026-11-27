import { describe, expect, it } from "vitest";
import { createBffApp } from "../src/create-app.js";

const SHARED_SECRET = "test-shared-secret";

const SKELETON_QUERY = /* GraphQL */ `
  query Skeleton {
    skeleton {
      message
    }
  }
`;

describe("GraphQL BFF seam", () => {
  it("rejects requests without the shared-secret header", async () => {
    const yoga = createBffApp({ sharedSecret: SHARED_SECRET });

    const response = await yoga.fetch("http://localhost/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ query: SKELETON_QUERY }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      errors: [{ message: "Unauthorized" }],
    });
  });

  it("rejects requests with an invalid shared-secret header", async () => {
    const yoga = createBffApp({ sharedSecret: SHARED_SECRET });

    const response = await yoga.fetch("http://localhost/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-bff-shared-secret": "wrong-secret",
      },
      body: JSON.stringify({ query: SKELETON_QUERY }),
    });

    expect(response.status).toBe(401);
  });

  it("returns the mock skeleton message when authenticated", async () => {
    const yoga = createBffApp({ sharedSecret: SHARED_SECRET });

    const response = await yoga.fetch("http://localhost/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-bff-shared-secret": SHARED_SECRET,
      },
      body: JSON.stringify({ query: SKELETON_QUERY }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        skeleton: {
          message: "Walking skeleton is alive",
        },
      },
    });
  });

  it("does not serve GraphiQL by default", async () => {
    const yoga = createBffApp({ sharedSecret: SHARED_SECRET });

    const response = await yoga.fetch("http://localhost/graphql", {
      method: "GET",
      headers: {
        accept: "text/html",
      },
    });

    expect(response.status).toBe(401);
  });

  it("serves GraphiQL without the shared-secret header when enabled", async () => {
    const yoga = createBffApp({ sharedSecret: SHARED_SECRET, graphiql: true });

    const response = await yoga.fetch("http://localhost/graphql", {
      method: "GET",
      headers: {
        accept: "text/html",
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/text\/html/);
    const html = await response.text();
    expect(html).toContain("x-bff-shared-secret");
    expect(html).toContain(SHARED_SECRET);
  });

  it("still rejects GraphQL operations without the shared-secret when GraphiQL is enabled", async () => {
    const yoga = createBffApp({ sharedSecret: SHARED_SECRET, graphiql: true });

    const response = await yoga.fetch("http://localhost/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ query: SKELETON_QUERY }),
    });

    expect(response.status).toBe(401);
  });
});
