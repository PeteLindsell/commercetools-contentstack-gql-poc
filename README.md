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

Edit secrets if you like; local defaults work for the walking skeleton. Product listing also needs the commercetools variables below.

## commercetools catalogue

The PoC uses one locale, one currency, one store, and one distribution channel. Defaults are `en-GB`, `GBP`, store `poc`, and channel `poc-retail`. There is no market switcher.

Create an API client in the Merchant Center with scope `manage_project:{projectKey}` (the seed creates product types, products, a channel, and a store). Put the credentials in the root `.env`:

| Variable | Purpose |
| --- | --- |
| `CTP_PROJECT_KEY` | commercetools project key |
| `CTP_CLIENT_ID` | API client id |
| `CTP_CLIENT_SECRET` | API client secret |
| `CTP_AUTH_URL` | Auth host for the project region |
| `CTP_API_URL` | API host for the project region |
| `CTP_LOCALE` | Single locale (default `en-GB`) |
| `CTP_CURRENCY` | Single currency (default `GBP`) |
| `CTP_STORE_KEY` | Single store key (default `poc`) |
| `CTP_CHANNEL_KEY` | Distribution channel key (default `poc-retail`) |
| `CTP_SCOPES` | Optional comma-separated scopes. Default `manage_project:{projectKey}` |

Seed a small custom catalogue (not vendor sample data). The script is safe to re-run: existing keys are left in place, and unpublished products are published.

```bash
pnpm seed:catalogue
```

Seeded Product Keys, each with size Variants `S`, `M`, and `L`:

| Product Key | Name |
| --- | --- |
| `organic-cotton-tee` | Organic cotton tee |
| `merino-crew-neck` | Merino crew neck |
| `linen-overshirt` | Linen overshirt |

Restart the BFF after filling in credentials. The product listing is [http://localhost:3000/products](http://localhost:3000/products). Without commercetools credentials the page reports that the catalogue is not configured; the walking skeleton still runs.

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

Then open [http://localhost:3000](http://localhost:3000). The homepage is a Server Component that queries `skeleton { message }` on the BFF using `x-bff-shared-secret`. View source / network in the browser: there is no GraphQL call from the client. [http://localhost:3000/products](http://localhost:3000/products) lists Products from commercetools the same way.

### GraphiQL (local)

GraphiQL is off by default. Set `BFF_GRAPHIQL=true`, restart the BFF, then open [http://localhost:4000/graphql](http://localhost:4000/graphql). When enabled, the IDE is preconfigured with `x-bff-shared-secret` so introspection and queries work. The storefront remains the only production-style BFF client; GraphiQL is an opt-in local exploration aid.

## Scripts

```bash
pnpm test            # BFF GraphQL seam tests (primary harness)
pnpm typecheck
pnpm lint
pnpm build
pnpm seed:catalogue  # create the commercetools catalogue (see above)
```

## GraphQL contract

```graphql
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
```

Authenticated requests must send header `x-bff-shared-secret` matching `BFF_SHARED_SECRET`.
