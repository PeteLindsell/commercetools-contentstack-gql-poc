const SHARED_SECRET_HEADER = "x-bff-shared-secret";

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export type ListedVariant = {
  sku: string;
  size: string;
  price: {
    centAmount: number;
    currencyCode: string;
  };
};

export type ListedProduct = {
  key: string;
  name: string;
  variants: ListedVariant[];
};

async function bffGraphql<T>(query: string): Promise<T> {
  const bffUrl = process.env.BFF_URL;
  const sharedSecret = process.env.BFF_SHARED_SECRET;

  if (!bffUrl) {
    throw new Error("BFF_URL is required");
  }
  if (!sharedSecret) {
    throw new Error("BFF_SHARED_SECRET is required");
  }

  const response = await fetch(bffUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [SHARED_SECRET_HEADER]: sharedSecret,
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`BFF request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  if (!payload.data) {
    throw new Error("BFF response missing data");
  }

  return payload.data;
}

export async function fetchSkeletonMessage(): Promise<string> {
  const data = await bffGraphql<{ skeleton: { message: string } }>(/* GraphQL */ `
    query Skeleton {
      skeleton {
        message
      }
    }
  `);

  const message = data.skeleton.message;
  if (!message) {
    throw new Error("BFF response missing skeleton.message");
  }

  return message;
}

export async function fetchProducts(): Promise<ListedProduct[]> {
  const data = await bffGraphql<{ products: ListedProduct[] }>(/* GraphQL */ `
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
  `);

  return data.products;
}
