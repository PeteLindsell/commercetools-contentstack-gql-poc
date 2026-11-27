export const PRODUCT_TYPE_KEY = "sized-good";
export const SIZE_ATTRIBUTE = "size";
export const SIZE_VALUES = ["S", "M", "L"] as const;

export type SizeValue = (typeof SIZE_VALUES)[number];

export type CatalogueVariant = {
  sku: string;
  size: SizeValue;
  centAmount: number;
};

export type CatalogueProduct = {
  key: string;
  name: string;
  slug: string;
  variants: CatalogueVariant[];
};

/** Tiny custom catalogue. Known Product Keys are the join for later enrichment. */
export const SEEDED_CATALOGUE: CatalogueProduct[] = [
  {
    key: "organic-cotton-tee",
    name: "Organic cotton tee",
    slug: "organic-cotton-tee",
    variants: [
      { sku: "organic-cotton-tee-s", size: "S", centAmount: 2800 },
      { sku: "organic-cotton-tee-m", size: "M", centAmount: 2800 },
      { sku: "organic-cotton-tee-l", size: "L", centAmount: 3200 },
    ],
  },
  {
    key: "merino-crew-neck",
    name: "Merino crew neck",
    slug: "merino-crew-neck",
    variants: [
      { sku: "merino-crew-neck-s", size: "S", centAmount: 6400 },
      { sku: "merino-crew-neck-m", size: "M", centAmount: 6400 },
      { sku: "merino-crew-neck-l", size: "L", centAmount: 6800 },
    ],
  },
  {
    key: "linen-overshirt",
    name: "Linen overshirt",
    slug: "linen-overshirt",
    variants: [
      { sku: "linen-overshirt-s", size: "S", centAmount: 8900 },
      { sku: "linen-overshirt-m", size: "M", centAmount: 8900 },
      { sku: "linen-overshirt-l", size: "L", centAmount: 9400 },
    ],
  },
];
