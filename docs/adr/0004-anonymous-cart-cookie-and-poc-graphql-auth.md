# Anonymous cart cookie and PoC GraphQL auth

Anonymous **Cart** / session identity is kept in an HTTP-only first-party cookie on the Next.js storefront origin (not on the BFF). The browser never calls GraphQL directly; the Next server forwards cart and auth context to the private BFF on each server-side request. Before end-to-end tests, GraphQL gains a real auth/session setup: a PoC login that uses env-configured **Customer** credentials (no signup UI or external IdP), then merges the anonymous cart. Checkout, orders, and payment stay out of scope — the journey stops at cart management.

Cross-origin browser→BFF cookies (CORS + `SameSite=None; Secure`) were considered and rejected once we chose Next-as-sole-GraphQL-client.

v1 uses a single locale, currency, and store/channel (configuration only; no market switcher). Cart lines are **Variants**; the PDP includes a simple one-attribute option picker (e.g. size). External API failure handling means mapped GraphQL errors and storefront error/empty states — not retries or circuit breakers.
