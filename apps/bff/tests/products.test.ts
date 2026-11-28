import { describe, expect, it } from "vitest";
import { createBffApp } from "../src/create-app.js";
import {
  CatalogueNotFoundError,
  type ProductCatalogue,
} from "../src/product-catalogue.js";

const SHARED_SECRET = "test-shared-secret";

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products {
    products {
      key
      name
      variants {
        sku
        size
        price {
          centAmount
          currencyCode
        }
      }
    }
  }
`;

const teeCatalogue: ProductCatalogue = {
  async listProducts() {
    return [
      {
        key: "organic-cotton-tee",
        name: "Organic cotton tee",
        variants: [
          {
            sku: "organic-cotton-tee-s",
            size: "S",
            price: { centAmount: 2800, currencyCode: "GBP" },
          },
          {
            sku: "organic-cotton-tee-m",
            size: "M",
            price: { centAmount: 2800, currencyCode: "GBP" },
          },
          {
            sku: "organic-cotton-tee-l",
            size: "L",
            price: { centAmount: 3200, currencyCode: "GBP" },
          },
        ],
      },
    ];
  },
};

async function queryProducts(productCatalogue: ProductCatalogue | undefined) {
  const yoga = createBffApp({
    sharedSecret: SHARED_SECRET,
    productCatalogue,
  });
  const response = await yoga.fetch("http://localhost/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-bff-shared-secret": SHARED_SECRET,
    },
    body: JSON.stringify({ query: PRODUCTS_QUERY }),
  });

  return response.json();
}

describe("Product listing query", () => {
  it("returns an empty Product list when the catalogue has no Products", async () => {
    const emptyCatalogue: ProductCatalogue = {
      async listProducts() {
        return [];
      },
    };

    await expect(queryProducts(emptyCatalogue)).resolves.toEqual({
      data: {
        products: [],
      },
    });
  });

  it("hides unexpected catalogue failures", async () => {
    const failingCatalogue: ProductCatalogue = {
      async listProducts() {
        throw new Error("socket hang up");
      },
    };

    const result = await queryProducts(failingCatalogue);
    expect(result.errors?.[0]?.message).toBe("Unexpected error.");
    expect(JSON.stringify(result)).not.toContain("socket hang up");
  });

  it("reports when the commercetools catalogue does not exist", async () => {
    const missingCatalogue: ProductCatalogue = {
      async listProducts() {
        throw new CatalogueNotFoundError();
      },
    };

    await expect(queryProducts(missingCatalogue)).resolves.toEqual({
      data: null,
      errors: [
        expect.objectContaining({
          message: "Product catalogue was not found for the configured store",
        }),
      ],
    });
  });

  it("reports that the Product catalogue is not configured", async () => {
    await expect(queryProducts(undefined)).resolves.toEqual({
      data: null,
      errors: [
        expect.objectContaining({
          message: "Product catalogue is not configured",
        }),
      ],
    });
  });

  it("lists Products with Product Keys, size Variants, and prices from commercetools", async () => {
    await expect(queryProducts(teeCatalogue)).resolves.toEqual({
      data: {
        products: [
          {
            key: "organic-cotton-tee",
            name: "Organic cotton tee",
            variants: [
              {
                sku: "organic-cotton-tee-s",
                size: "S",
                price: { centAmount: 2800, currencyCode: "GBP" },
              },
              {
                sku: "organic-cotton-tee-m",
                size: "M",
                price: { centAmount: 2800, currencyCode: "GBP" },
              },
              {
                sku: "organic-cotton-tee-l",
                size: "L",
                price: { centAmount: 3200, currencyCode: "GBP" },
              },
            ],
          },
        ],
      },
    });
  });
});
