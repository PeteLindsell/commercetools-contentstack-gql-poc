import type {
  ByProjectKeyRequestBuilder,
  Channel,
  ProductType,
  ProductVariantDraft,
  Store,
  StoreUpdateAction,
} from "@commercetools/platform-sdk";
import { pathToFileURL } from "node:url";
import {
  PRODUCT_TYPE_KEY,
  SEEDED_CATALOGUE,
  SIZE_ATTRIBUTE,
  SIZE_VALUES,
  type CatalogueProduct,
  type CatalogueVariant,
} from "./catalogue-definition.js";
import { readCommerceConfig, type CommerceConfig } from "./commerce-config.js";
import {
  createCommerceApiRoot,
  describeCommerceError,
  readCommerceBody,
} from "./commercetools-client.js";

export async function seedCatalogue(env: NodeJS.ProcessEnv): Promise<string[]> {
  const config = readCommerceConfig(env);
  if (!config) {
    throw new Error(
      "Missing commercetools configuration: CTP_PROJECT_KEY, CTP_CLIENT_ID, CTP_CLIENT_SECRET, CTP_AUTH_URL, CTP_API_URL",
    );
  }

  const apiRoot = createCommerceApiRoot(config);
  const notes: string[] = [];
  const productType = await ensureProductType(apiRoot, config, notes);
  const channel = await ensureChannel(apiRoot, config, notes);
  await ensureStore(apiRoot, config, channel, notes);

  for (const product of SEEDED_CATALOGUE) {
    notes.push(await ensureProduct(apiRoot, config, productType, channel, product));
  }

  return notes;
}

async function ensureProductType(
  apiRoot: ByProjectKeyRequestBuilder,
  config: CommerceConfig,
  notes: string[],
): Promise<ProductType> {
  const existing = await readCommerceBody(() =>
    apiRoot.productTypes().withKey({ key: PRODUCT_TYPE_KEY }).get().execute(),
  );
  if (existing) {
    notes.push(`product type ${PRODUCT_TYPE_KEY} already exists`);
    return existing;
  }

  const created = await apiRoot
    .productTypes()
    .post({
      body: {
        key: PRODUCT_TYPE_KEY,
        name: "Sized good",
        description: "PoC product with a single size attribute",
        attributes: [
          {
            name: SIZE_ATTRIBUTE,
            label: { [config.locale]: "Size" },
            isRequired: true,
            type: {
              name: "enum",
              values: SIZE_VALUES.map((size) => ({ key: size, label: size })),
            },
            attributeConstraint: "None",
            isSearchable: true,
            inputHint: "SingleLine",
          },
        ],
      },
    })
    .execute();
  notes.push(`created product type ${PRODUCT_TYPE_KEY}`);
  return created.body;
}

async function ensureChannel(
  apiRoot: ByProjectKeyRequestBuilder,
  config: CommerceConfig,
  notes: string[],
): Promise<Channel> {
  const existing = await readCommerceBody(() =>
    apiRoot.channels().withKey({ key: config.channelKey }).get().execute(),
  );
  if (existing) {
    notes.push(`channel ${config.channelKey} already exists`);
    return existing;
  }

  const created = await apiRoot
    .channels()
    .post({
      body: {
        key: config.channelKey,
        roles: ["ProductDistribution"],
        name: { [config.locale]: "PoC retail" },
      },
    })
    .execute();
  notes.push(`created channel ${config.channelKey}`);
  return created.body;
}

async function ensureStore(
  apiRoot: ByProjectKeyRequestBuilder,
  config: CommerceConfig,
  channel: Channel,
  notes: string[],
): Promise<Store> {
  const existing = await readCommerceBody(() =>
    apiRoot.stores().withKey({ key: config.storeKey }).get().execute(),
  );

  if (!existing) {
    const created = await apiRoot
      .stores()
      .post({
        body: {
          key: config.storeKey,
          name: { [config.locale]: "PoC store" },
          languages: [config.locale],
          distributionChannels: [{ typeId: "channel", id: channel.id }],
        },
      })
      .execute();
    notes.push(`created store ${config.storeKey}`);
    return created.body;
  }

  const actions: StoreUpdateAction[] = [];
  if (!existing.languages.includes(config.locale)) {
    actions.push({
      action: "setLanguages",
      languages: [...existing.languages, config.locale],
    });
  }
  if (
    !existing.distributionChannels.some((reference) => reference.id === channel.id)
  ) {
    actions.push({
      action: "addDistributionChannel",
      distributionChannel: { typeId: "channel", id: channel.id },
    });
  }

  if (actions.length === 0) {
    notes.push(`store ${config.storeKey} already exists`);
    return existing;
  }

  const updated = await apiRoot
    .stores()
    .withKey({ key: config.storeKey })
    .post({
      body: {
        version: existing.version,
        actions,
      },
    })
    .execute();
  notes.push(`updated store ${config.storeKey}`);
  return updated.body;
}

async function ensureProduct(
  apiRoot: ByProjectKeyRequestBuilder,
  config: CommerceConfig,
  productType: ProductType,
  channel: Channel,
  product: CatalogueProduct,
): Promise<string> {
  const existing = await readCommerceBody(() =>
    apiRoot.products().withKey({ key: product.key }).get().execute(),
  );

  if (existing) {
    if (existing.masterData.published) {
      return `skipped ${product.key} (already published)`;
    }
    await publishProduct(apiRoot, product.key, existing.version);
    return `published ${product.key}`;
  }

  const [master, ...rest] = product.variants;
  if (!master) {
    throw new Error(`Product ${product.key} has no Variants`);
  }

  const created = await apiRoot
    .products()
    .post({
      body: {
        key: product.key,
        productType: { typeId: "product-type", id: productType.id },
        name: { [config.locale]: product.name },
        slug: { [config.locale]: product.slug },
        masterVariant: variantDraft(master, config, channel.id),
        variants: rest.map((variant) => variantDraft(variant, config, channel.id)),
      },
    })
    .execute();

  await publishProduct(apiRoot, product.key, created.body.version);
  return `created ${product.key}`;
}

function variantDraft(
  variant: CatalogueVariant,
  config: CommerceConfig,
  channelId: string,
): ProductVariantDraft {
  return {
    sku: variant.sku,
    attributes: [{ name: SIZE_ATTRIBUTE, value: variant.size }],
    prices: [
      {
        value: {
          currencyCode: config.currency,
          centAmount: variant.centAmount,
        },
        channel: { typeId: "channel", id: channelId },
      },
    ],
  };
}

async function publishProduct(
  apiRoot: ByProjectKeyRequestBuilder,
  key: string,
  version: number,
): Promise<void> {
  await apiRoot
    .products()
    .withKey({ key })
    .post({
      body: {
        version,
        actions: [{ action: "publish" }],
      },
    })
    .execute();
}

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return import.meta.url === pathToFileURL(entry).href;
}

if (isDirectExecution()) {
  seedCatalogue(process.env)
    .then((notes) => {
      for (const note of notes) {
        console.log(note);
      }
    })
    .catch((error: unknown) => {
      console.error(describeCommerceError(error));
      process.exitCode = 1;
    });
}
