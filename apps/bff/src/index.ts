import { createServer } from "node:http";
import { readCommerceConfig } from "./commerce-config.js";
import { createCommercetoolsCatalogue } from "./commercetools-catalogue.js";
import { createBffApp } from "./create-app.js";

const sharedSecret = process.env.BFF_SHARED_SECRET;
if (!sharedSecret) {
  throw new Error("BFF_SHARED_SECRET is required");
}

const port = Number(process.env.BFF_PORT ?? "4000");
const graphiql = process.env.BFF_GRAPHIQL === "true";
const commerceConfig = readCommerceConfig(process.env);
const yoga = createBffApp({
  sharedSecret,
  graphiql,
  productCatalogue: commerceConfig
    ? createCommercetoolsCatalogue(commerceConfig)
    : undefined,
});

const server = createServer(yoga);
server.listen(port, () => {
  console.log(`GraphQL BFF ready at http://localhost:${port}/graphql`);
  if (graphiql) {
    console.log("GraphiQL enabled (local exploration only)");
  }
  if (commerceConfig) {
    console.log(
      `Product catalogue: store ${commerceConfig.storeKey}, ${commerceConfig.locale}, ${commerceConfig.currency}, channel ${commerceConfig.channelKey}`,
    );
  } else {
    console.log("Product catalogue is not configured");
  }
});
