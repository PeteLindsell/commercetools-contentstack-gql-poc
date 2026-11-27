import { createSchema, createYoga, shouldRenderGraphiQL } from "graphql-yoga";

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
};

export function createBffApp(options: BffAppOptions) {
  const schema = createSchema({
    typeDefs: /* GraphQL */ `
      type Query {
        skeleton: Skeleton!
      }

      type Skeleton {
        message: String!
      }
    `,
    resolvers: {
      Query: {
        skeleton: () => ({ message: SKELETON_MESSAGE }),
      },
    },
  });

  const graphiqlEnabled = options.graphiql === true;

  return createYoga({
    schema,
    graphqlEndpoint: "/graphql",
    landingPage: false,
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
