# commercetools owns Product; Contentstack owns enrichment

For this PoC, commercetools is the system of record for a sellable **Product** (identity, variants, price). Contentstack holds optional **Product Enrichment** keyed by a shared product key/SKU; the product detail page composes both. We rejected Contentstack-as-merchandising-master and dual-maintained catalogues because they either invert the stated commerce/cart responsibility or double authoring cost for a learning PoC.
