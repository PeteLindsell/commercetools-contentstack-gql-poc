import { createServer } from "node:http";
import { createBffApp } from "./create-app.js";

const sharedSecret = process.env.BFF_SHARED_SECRET;
if (!sharedSecret) {
  throw new Error("BFF_SHARED_SECRET is required");
}

const port = Number(process.env.BFF_PORT ?? "4000");
const graphiql = process.env.BFF_GRAPHIQL !== "false";
const yoga = createBffApp({ sharedSecret, graphiql });

const server = createServer(yoga);
server.listen(port, () => {
  console.log(`GraphQL BFF ready at http://localhost:${port}/graphql`);
  if (graphiql) {
    console.log("GraphiQL enabled (set BFF_GRAPHIQL=false to disable)");
  }
});
