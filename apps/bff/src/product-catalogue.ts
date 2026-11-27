export type VariantPrice = {
  centAmount: number;
  currencyCode: string;
};

export type ListedVariant = {
  sku: string;
  size: string;
  price: VariantPrice;
};

export type ListedProduct = {
  key: string;
  name: string;
  variants: ListedVariant[];
};

/** commercetools boundary the Product listing query calls. Tests substitute a double. */
export type ProductCatalogue = {
  listProducts(): Promise<ListedProduct[]>;
};

/** The configured store or distribution channel does not exist in commercetools. */
export class CatalogueNotFoundError extends Error {
  constructor() {
    super("Product catalogue was not found for the configured store");
    this.name = "CatalogueNotFoundError";
  }
}
