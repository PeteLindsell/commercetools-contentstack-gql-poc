import { createSchema, createYoga } from "graphql-yoga";

export const SHARED_SECRET_HEADER = "x-bff-shared-secret";

const SKELETON_MESSAGE = "Walking skeleton is alive";

export type BffAppOptions = {
  sharedSecret: string;
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

  return createYoga({
    schema,
    graphqlEndpoint: "/graphql",
    landingPage: false,
    plugins: [
      {
        onRequest({ request, fetchAPI, endResponse }) {
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
