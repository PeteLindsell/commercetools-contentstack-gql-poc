import { createServer } from "node:http";
import { createContentstackHomepageSource } from "./contentstack-homepage-source.js";
import { createBffApp } from "./create-app.js";

const sharedSecret = process.env.BFF_SHARED_SECRET;
if (!sharedSecret) {
  throw new Error("BFF_SHARED_SECRET is required");
}

const port = Number(process.env.BFF_PORT ?? "4000");
const graphiql = process.env.BFF_GRAPHIQL === "true";
const homepageSource = readHomepageSource();
const yoga = createBffApp({ sharedSecret, graphiql, homepageSource });

const server = createServer(yoga);
server.listen(port, () => {
  console.log(`GraphQL BFF ready at http://localhost:${port}/graphql`);
  if (graphiql) {
    console.log("GraphiQL enabled (local exploration only)");
  }
  if (!homepageSource) {
    console.log(
      "Contentstack Homepage is not configured. Set CONTENTSTACK_API_KEY, CONTENTSTACK_DELIVERY_TOKEN, and CONTENTSTACK_ENVIRONMENT.",
    );
  }
});

function readHomepageSource() {
  const apiKey = process.env.CONTENTSTACK_API_KEY?.trim();
  const deliveryToken = process.env.CONTENTSTACK_DELIVERY_TOKEN?.trim();
  const environment = process.env.CONTENTSTACK_ENVIRONMENT?.trim();
  const region = process.env.CONTENTSTACK_REGION?.trim();

  if (!apiKey || !deliveryToken || !environment) {
    return undefined;
  }

  return createContentstackHomepageSource({
    apiKey,
    deliveryToken,
    environment,
    region: region || undefined,
  });
}
