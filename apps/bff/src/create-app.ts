import { GraphQLError } from "graphql";
import {
  createSchema,
  createYoga,
  maskError,
  shouldRenderGraphiQL,
} from "graphql-yoga";
import {
  presentHomepage,
  type HomepageSource,
} from "./homepage-source.js";

export const SHARED_SECRET_HEADER = "x-bff-shared-secret";

/**
 * Yoga hides resolver failures unless it recognizes a GraphQLError.
 * `instanceof` breaks when Vitest and Yoga load different `graphql` copies,
 * so a reported error is identified by name, including one wrapped around another.
 */
function isReportedGraphQLError(error: unknown): error is Error {
  if (!(error instanceof Error) || error.name !== "GraphQLError") {
    return false;
  }

  const originalError =
    "originalError" in error ? error.originalError : undefined;
  if (originalError == null) {
    return true;
  }

  return isReportedGraphQLError(originalError);
}

const SKELETON_MESSAGE = "Walking skeleton is alive";

const DEFAULT_GRAPHIQL_QUERY = /* GraphQL */ `
query Homepage {
  homepage {
    headline
    body
    imageUrl
  }
}
`.trim();

export type BffAppOptions = {
  sharedSecret: string;
  /** Local GraphiQL IDE. Off by default; enable for local exploration. */
  graphiql?: boolean;
  /** Contentstack Homepage adapter. Omitted until the CMS is configured. */
  homepageSource?: HomepageSource;
};

export function createBffApp(options: BffAppOptions) {
  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        skeleton: Skeleton!
        homepage: Homepage
      }

      type Skeleton {
        message: String!
      }

      """
      Editorial Homepage from Contentstack. No Product references.
      Null when the Homepage entry is missing or has no headline and no body.
      """
      type Homepage {
        headline: String!
        body: String!
        imageUrl: String
      }
    `,
    resolvers: {
      Query: {
        skeleton: () => ({ message: SKELETON_MESSAGE }),
        homepage: async () => {
          if (!options.homepageSource) {
            throw new GraphQLError("Homepage source is not configured");
          }

          const content = await options.homepageSource.getHomepage();
          return presentHomepage(content);
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
        if (isReportedGraphQLError(error)) {
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
