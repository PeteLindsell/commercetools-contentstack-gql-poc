# GraphQL BFF is the storefront’s only backend

Next.js talks only to a GraphQL BFF. The BFF owns composition of Contentstack and commercetools (Homepage, Product listing/detail with Product Enrichment, Cart). We rejected direct Next.js-to-vendor calls and a hybrid split so failure handling, schema, and ticket boundaries stay in one place for this PoC.
