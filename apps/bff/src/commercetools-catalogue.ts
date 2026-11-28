import type {
  Price,
  ProductProjection,
  ProductVariant,
} from "@commercetools/platform-sdk";
import { PRODUCT_TYPE_KEY, SIZE_ATTRIBUTE } from "./catalogue-definition.js";
import type { CommerceConfig } from "./commerce-config.js";
import {
  createCommerceApiRoot,
  readCommerceBody,
} from "./commercetools-client.js";
import {
  CatalogueNotFoundError,
  type ListedProduct,
  type ListedVariant,
  type ProductCatalogue,
  type VariantPrice,
} from "./product-catalogue.js";

const LISTING_LIMIT = 50;

export function createCommercetoolsCatalogue(
  config: CommerceConfig,
): ProductCatalogue {
  const apiRoot = createCommerceApiRoot(config);
  let priceChannelId: string | undefined;
  let productTypeId: string | undefined;

  return {
    async listProducts() {
      const [channelId, typeId] = await Promise.all([
        distributionChannelId(),
        sizedGoodProductTypeId(),
      ]);
      const response = await apiRoot
        .productProjections()
        .get({
          queryArgs: {
            limit: LISTING_LIMIT,
            staged: false,
            // Sample catalogues dwarf the PoC SKUs; restrict to our product type.
            where: `productType(id="${typeId}")`,
            priceCurrency: config.currency,
            priceChannel: channelId,
            storeProjection: config.storeKey,
            localeProjection: config.locale,
            withTotal: false,
          },
        })
        .execute();

      return response.body.results
        .flatMap((projection) => {
          const listed = toListedProduct(projection, config, channelId);
          return listed ? [listed] : [];
        })
        .sort((left, right) =>
          left.name.localeCompare(right.name, config.locale),
        );
    },
  };

  async function sizedGoodProductTypeId(): Promise<string> {
    if (productTypeId) {
      return productTypeId;
    }

    const productType = await readCommerceBody(() =>
      apiRoot.productTypes().withKey({ key: PRODUCT_TYPE_KEY }).get().execute(),
    );
    if (!productType) {
      throw new CatalogueNotFoundError();
    }

    productTypeId = productType.id;
    return productType.id;
  }

  async function distributionChannelId(): Promise<string> {
    if (priceChannelId) {
      return priceChannelId;
    }

    const [store, channel] = await Promise.all([
      readCommerceBody(() =>
        apiRoot.stores().withKey({ key: config.storeKey }).get().execute(),
      ),
      readCommerceBody(() =>
        apiRoot
          .channels()
          .withKey({ key: config.channelKey })
          .get()
          .execute(),
      ),
    ]);

    if (!store || !channel) {
      throw new CatalogueNotFoundError();
    }

    const assigned = store.distributionChannels.some(
      (reference) => reference.id === channel.id,
    );
    if (!assigned) {
      throw new Error(
        `Store ${config.storeKey} does not use distribution channel ${config.channelKey}`,
      );
    }

    priceChannelId = channel.id;
    return channel.id;
  }
}

function toListedProduct(
  projection: ProductProjection,
  config: CommerceConfig,
  channelId: string,
): ListedProduct | undefined {
  const key = projection.key?.trim();
  const name = projection.name[config.locale]?.trim() ?? "";
  if (!key || !name) {
    return undefined;
  }

  const variants = [projection.masterVariant, ...projection.variants].flatMap(
    (variant) => {
      const listed = toListedVariant(variant, config.currency, channelId);
      return listed ? [listed] : [];
    },
  );
  if (variants.length === 0) {
    return undefined;
  }

  return { key, name, variants };
}

function toListedVariant(
  variant: ProductVariant,
  currency: string,
  channelId: string,
): ListedVariant | undefined {
  const sku = variant.sku?.trim();
  const size = readSize(variant);
  const price = readPrice(variant, currency, channelId);
  if (!sku || !size || !price) {
    return undefined;
  }
  return { sku, size, price };
}

function readSize(variant: ProductVariant): string | undefined {
  const attribute = variant.attributes?.find(
    (item) => item.name === SIZE_ATTRIBUTE,
  );
  if (!attribute) {
    return undefined;
  }
  return enumKey(attribute.value);
}

function enumKey(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "key" in value &&
    typeof value.key === "string" &&
    value.key.trim()
  ) {
    return value.key;
  }
  return undefined;
}

function readPrice(
  variant: ProductVariant,
  currency: string,
  channelId: string,
): VariantPrice | undefined {
  const selected = moneyForChannel(variant.price, currency, channelId);
  if (selected) {
    return selected;
  }
  for (const price of variant.prices ?? []) {
    const match = moneyForChannel(price, currency, channelId);
    if (match) {
      return match;
    }
  }
  return undefined;
}

function moneyForChannel(
  price: Price | undefined,
  currency: string,
  channelId: string,
): VariantPrice | undefined {
  if (
    !price ||
    price.value.currencyCode !== currency ||
    price.channel?.id !== channelId
  ) {
    return undefined;
  }
  return {
    centAmount: price.value.centAmount,
    currencyCode: price.value.currencyCode,
  };
}
