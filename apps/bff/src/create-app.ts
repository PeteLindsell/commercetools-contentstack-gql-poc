import { GraphQLError } from "graphql";
import { createSchema, createYoga, maskError, shouldRenderGraphiQL } from "graphql-yoga";
import {
  CatalogueNotFoundError,
  type ProductCatalogue,
} from "./product-catalogue.js";

export const SHARED_SECRET_HEADER = "x-bff-shared-secret";

const SKELETON_MESSAGE = "Walking skeleton is alive";

const DEFAULT_GRAPHIQL_QUERY = /* GraphQL */ `
query Skeleton {
  skeleton {
    message
  }
}
`.trim();

export type BffAppOptions = {
  sharedSecret: string;
  /** Local GraphiQL IDE. Off by default; enable for local exploration. */
  graphiql?: boolean;
  /** commercetools Product catalogue. Omitted until commerce env is configured. */
  productCatalogue?: ProductCatalogue;
};

/**
 * Yoga masks thrown GraphQLErrors when the CJS and ESM graphql builds disagree
 * on `instanceof`. Treat a GraphQLError with no non-GraphQL cause as intentional.
 */
function isIntentionalGraphQLError(error: unknown): error is Error {
  let current: unknown = error;
  while (current instanceof Error && current.name === "GraphQLError") {
    if (!("originalError" in current) || current.originalError == null) {
      return true;
    }
    current = current.originalError;
  }
  return false;
}

export function createBffApp(options: BffAppOptions) {
  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        skeleton: Skeleton!
        """
        Products for sale, projected from commercetools for the configured locale, currency, and store.
        """
        products: [Product!]!
      }

      type Skeleton {
        message: String!
      }

      type Product {
        key: String!
        name: String!
        variants: [Variant!]!
      }

      type Variant {
        sku: String!
        size: String!
        price: Money!
      }

      type Money {
        centAmount: Int!
        currencyCode: String!
      }
    `,
    resolvers: {
      Query: {
        skeleton: () => ({ message: SKELETON_MESSAGE }),
        products: async () => {
          if (!options.productCatalogue) {
            throw new GraphQLError("Product catalogue is not configured");
          }

          try {
            return await options.productCatalogue.listProducts();
          } catch (error) {
            if (error instanceof CatalogueNotFoundError) {
              throw new GraphQLError(error.message);
            }
            throw error;
          }
        },
      },
    },
  });

  const graphiqlEnabled = options.graphiql === true;

  return createYoga({
    schema,
    graphqlEndpoint: "/graphql",
    landingPage: false,
    maskedErrors: {
      maskError(error, message, isDev) {
        if (isIntentionalGraphQLError(error)) {
          return error;
        }
        return maskError(error, message, isDev);
      },
    },
    graphiql: graphiqlEnabled
      ? {
          title: "PoC GraphQL BFF",
          defaultQuery: DEFAULT_GRAPHIQL_QUERY,
          headers: JSON.stringify({
            [SHARED_SECRET_HEADER]: options.sharedSecret,
          }),
          additionalHeaders: {
            [SHARED_SECRET_HEADER]: options.sharedSecret,
          },
        }
      : false,
    plugins: [
      {
        onRequest({ request, fetchAPI, endResponse }) {
          if (graphiqlEnabled && shouldRenderGraphiQL(request)) {
            return;
          }

          const sharedSecretHeader = request.headers.get(SHARED_SECRET_HEADER);
          if (sharedSecretHeader !== options.sharedSecret) {
            endResponse(
              new fetchAPI.Response(
                JSON.stringify({ errors: [{ message: "Unauthorized" }] }),
                {
                  status: 401,
                  headers: { "content-type": "application/json" },
                },
              ),
            );
          }
        },
      },
    ],
  });
}
