import { createServer } from "node:http";
import { createBffApp } from "./create-app.js";

const sharedSecret = process.env.BFF_SHARED_SECRET;
if (!sharedSecret) {
  throw new Error("BFF_SHARED_SECRET is required");
}

const port = Number(process.env.BFF_PORT ?? "4000");
const yoga = createBffApp({ sharedSecret });

const server = createServer(yoga);
server.listen(port, () => {
  console.log(`GraphQL BFF ready at http://localhost:${port}/graphql`);
});
