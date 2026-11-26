# Headless storefront PoC

A learning proof of concept that composes Contentstack content with commercetools commerce for browse, product detail, cart, and a thin authenticated cart-merge path before end-to-end proof.

## Language

**Product**:
A sellable item whose commercial identity, variants, and price are owned by commercetools. It may optionally be enriched by **Product Enrichment**. A **Product** is offered for sale as one or more **Variants**.
_Avoid_: Item, SKU (when meaning the whole sellable thing), catalogue entry

**Variant**:
A concrete sellable SKU of a **Product** (for example a size), with its own price and availability. Cart line items refer to a **Variant**, not to the **Product** alone.
_Avoid_: Option, SKU-as-product, child product

**Product Key**:
The stable shared identifier for a **Product** used to join commercetools data with **Product Enrichment** in Contentstack.
_Avoid_: SKU (as the product-level join), commercetools id, slug

**Product Enrichment**:
Editorial content in Contentstack that refers to a **Product** by **Product Key**, such as copy or media shown on the product detail page. Absence of enrichment does not prevent the **Product** from being sold.
_Avoid_: CMS product, content product, merchandising product

**Homepage**:
A simple Contentstack-managed landing page used to prove CMS integration. It carries only basic editorial fields (for example headline, short body, optional image) and does not reference **Products**.
_Avoid_: PLP, category page, marketing site

**Cart**:
A commercetools cart holding line items for a **Shopper**, including quantities and totals.
_Avoid_: Basket, bag, order

**Shopper**:
The person using the storefront. In early cart work they are anonymous; later they may authenticate as a **Customer** so an anonymous **Cart** can be merged.
_Avoid_: User, account, buyer, client

**Customer**:
A commercetools customer identity used for the PoC login path. The storefront does not implement general signup or a full identity product; login uses configured PoC credentials exposed through GraphQL auth/session.
_Avoid_: User, account, IdP user
