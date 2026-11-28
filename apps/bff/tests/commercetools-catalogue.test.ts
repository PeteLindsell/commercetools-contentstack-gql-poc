import type { ProductProjection } from "@commercetools/platform-sdk";
import { describe, expect, it } from "vitest";
import { SIZE_ATTRIBUTE } from "../src/catalogue-definition.js";
import { listProductsFromProjections } from "../src/commercetools-catalogue.js";

const LOCALE = "en-GB";
const CURRENCY = "GBP";
const CHANNEL_ID = "channel-poc-retail";

const market = {
  locale: LOCALE,
  currency: CURRENCY,
};

function projection(overrides: {
  key?: string;
  name?: Record<string, string>;
  masterSku?: string;
  size?: unknown;
  priceChannelId?: string | undefined;
  priceCurrency?: string;
  centAmount?: number;
  extraVariants?: ProductProjection["variants"];
}): ProductProjection {
  const priceChannelId =
    "priceChannelId" in overrides ? overrides.priceChannelId : CHANNEL_ID;
  const price =
    priceChannelId === undefined
      ? undefined
      : {
          id: "price-1",
          value: {
            type: "centPrecision" as const,
            currencyCode: overrides.priceCurrency ?? CURRENCY,
            centAmount: overrides.centAmount ?? 2800,
            fractionDigits: 2,
          },
          channel: { typeId: "channel" as const, id: priceChannelId },
        };

  return {
    id: "proj-1",
    version: 1,
    createdAt: "2020-01-01T00:00:00.000Z",
    lastModifiedAt: "2020-01-01T00:00:00.000Z",
    productType: { typeId: "product-type", id: "pt-1" },
    name: overrides.name ?? { [LOCALE]: "Organic cotton tee" },
    slug: { [LOCALE]: "organic-cotton-tee" },
    categories: [],
    categoryOrderHints: {},
    attributes: [],
    masterVariant: {
      id: 1,
      sku: overrides.masterSku ?? "organic-cotton-tee-s",
      attributes:
        "size" in overrides && overrides.size === undefined
          ? []
          : [
              {
                name: SIZE_ATTRIBUTE,
                value: overrides.size ?? { key: "S", label: "S" },
              },
            ],
      price,
      prices: price ? [price] : [],
    },
    variants: overrides.extraVariants ?? [],
    key: overrides.key ?? "organic-cotton-tee",
  } as ProductProjection;
}

describe("listProductsFromProjections", () => {
  it("lists a Product with locale name, size Variant, and channel price", () => {
    expect(
      listProductsFromProjections([projection({})], market, CHANNEL_ID),
    ).toEqual([
      {
        key: "organic-cotton-tee",
        name: "Organic cotton tee",
        variants: [
          {
            sku: "organic-cotton-tee-s",
            size: "S",
            price: { centAmount: 2800, currencyCode: "GBP" },
          },
        ],
      },
    ]);
  });

  it("drops a Product whose name is missing for the configured locale", () => {
    expect(
      listProductsFromProjections(
        [projection({ name: { "en-US": "Organic cotton tee" } })],
        market,
        CHANNEL_ID,
      ),
    ).toEqual([]);
  });

  it("drops Variants without the PoC size attribute or the configured channel price", () => {
    expect(
      listProductsFromProjections(
        [
          projection({ size: undefined }),
          projection({
            key: "wrong-channel",
            masterSku: "wrong-channel-s",
            priceChannelId: "other-channel",
          }),
          projection({
            key: "wrong-currency",
            masterSku: "wrong-currency-s",
            priceCurrency: "EUR",
          }),
        ],
        market,
        CHANNEL_ID,
      ),
    ).toEqual([]);
  });

  it("sorts listed Products by name in the configured locale", () => {
    const listed = listProductsFromProjections(
      [
        projection({
          key: "merino-crew-neck",
          name: { [LOCALE]: "Merino crew neck" },
          masterSku: "merino-crew-neck-s",
        }),
        projection({
          key: "linen-overshirt",
          name: { [LOCALE]: "Linen overshirt" },
          masterSku: "linen-overshirt-s",
        }),
      ],
      market,
      CHANNEL_ID,
    );

    expect(listed.map((product) => product.key)).toEqual([
      "linen-overshirt",
      "merino-crew-neck",
    ]);
  });
});
