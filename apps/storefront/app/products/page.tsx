import { fetchProducts, type ListedVariant } from "@/lib/bff-client";

export default async function ProductListingPage() {
  try {
    const products = await fetchProducts();

    return (
      <main>
        <h1>Products</h1>
        {products.length === 0 ? (
          <p>No products are available.</p>
        ) : (
          <ul data-testid="product-listing">
            {products.map((product) => (
              <li key={product.key}>
                <article data-testid="product">
                  <h2>{product.name}</h2>
                  <p>Product Key: {product.key}</p>
                  <p>{startingPrice(product.variants)}</p>
                  <p>Sizes: {product.variants.map((variant) => variant.size).join(", ")}</p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Product listing failed";

    return (
      <main>
        <h1>Products</h1>
        <p role="alert">{message}</p>
      </main>
    );
  }
}

function startingPrice(variants: ListedVariant[]): string {
  const first = variants[0];
  if (!first) {
    return "Price unavailable";
  }

  const lowest = variants.reduce(
    (cheapest, variant) =>
      variant.price.centAmount < cheapest.price.centAmount ? variant : cheapest,
    first,
  );
  return `From ${formatMoney(lowest.price.centAmount, lowest.price.currencyCode)}`;
}

function formatMoney(centAmount: number, currencyCode: string): string {
  const sign = centAmount < 0 ? "-" : "";
  const absolute = Math.abs(centAmount);
  const major = Math.trunc(absolute / 100);
  const minor = (absolute % 100).toString().padStart(2, "0");
  return `${sign}${currencyCode} ${major}.${minor}`;
}
