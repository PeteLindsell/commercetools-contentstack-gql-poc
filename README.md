# Headless storefront PoC

Monorepo proof of concept: a Next.js storefront and a separate private GraphQL BFF. The browser never calls GraphQL; the Next server is the sole BFF client and authenticates with a shared-secret header.

Domain language lives in [`GLOSSARY.md`](./GLOSSARY.md). Architectural decisions live in [`docs/adr/`](./docs/adr/).

## Apps

| App | Package | Local URL |
| --- | --- | --- |
| GraphQL BFF | `@poc/bff` | `http://localhost:4000/graphql` |
| Next.js storefront | `@poc/storefront` | `http://localhost:3000` |

## Prerequisites

- Node.js 22+ (tested with 24)
- [pnpm](https://pnpm.io/) 12+

## Setup

```bash
pnpm install
cp .env.example .env
cp .env.example apps/storefront/.env.local
```

Edit secrets if you like; local defaults work for the walking skeleton.

## Run locally (two processes)

From the repo root, either start both together:

```bash
pnpm dev
```

Or start them in separate terminals:

```bash
pnpm dev:bff
pnpm dev:storefront
```

Then open [http://localhost:3000](http://localhost:3000). The homepage is a Server Component that queries `skeleton { message }` on the BFF using `x-bff-shared-secret`. View source / network in the browser: there is no GraphQL call from the client.

### GraphiQL (local)

GraphiQL is off by default. Set `BFF_GRAPHIQL=true`, restart the BFF, then open [http://localhost:4000/graphql](http://localhost:4000/graphql). When enabled, the IDE is preconfigured with `x-bff-shared-secret` so introspection and queries work. The storefront remains the only production-style BFF client; GraphiQL is an opt-in local exploration aid.

## Scripts

```bash
pnpm test        # BFF GraphQL seam tests (primary harness)
pnpm typecheck
pnpm lint
pnpm build
```

## Walking skeleton GraphQL contract

```graphql
type Query {
  skeleton: Skeleton!
}

type Skeleton {
  message: String!
}
```

Authenticated requests must send header `x-bff-shared-secret` matching `BFF_SHARED_SECRET`.
