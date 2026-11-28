# Contentstack Homepage checklist

The storefront Homepage is one published Contentstack entry. The BFF reads it with the Content Delivery API. Do not add Product references, Product Keys, or any other commerce fields to this content type.

Set the variables below in the repo-root `.env` (the BFF process). The storefront does not call Contentstack.

| Variable | Purpose |
| --- | --- |
| `CONTENTSTACK_API_KEY` | Stack API key |
| `CONTENTSTACK_DELIVERY_TOKEN` | Delivery token scoped to the environment you publish to |
| `CONTENTSTACK_ENVIRONMENT` | Environment name, for example `production` |
| `CONTENTSTACK_REGION` | `na` (default), `eu`, `au`, `azure-na`, `azure-eu`, `gcp-na`, or `gcp-eu` |

## Content type

Create a content type with UID `homepage`. Use a single-entry content type if the UI offers it. Otherwise create only one entry.

| Field UID | Contentstack field | Shown on the storefront |
| --- | --- | --- |
| `title` | Title (required by Contentstack) | No. Any label is fine, for example `Homepage`. |
| `headline` | Single line textbox | Yes |
| `body` | Multi line textbox | Yes |
| `image` | File, one file, optional | Yes, when a file is published |

Do not add reference fields, JSON product blobs, or a Product Key.

## Entry

1. Create one `homepage` entry.
2. Set `headline` and `body`. Add `image` only if you want a picture on the page.
3. Publish the entry to the environment named by `CONTENTSTACK_DELIVERY_TOKEN` / `CONTENTSTACK_ENVIRONMENT`.
4. In the stack, open Settings → Tokens → Delivery Tokens and copy the API key and that environment's delivery token into `.env`.
5. Restart the BFF (`pnpm dev:bff` or `pnpm dev`).

## What the shopper sees

- A published headline and/or body renders on `/`.
- No published entry, or an entry whose headline and body are both blank, renders `No Homepage content is published.`
- A missing or blank image omits the picture. The text still renders.
- If the three required variables are unset, the BFF still starts and the Homepage query returns the error `Homepage source is not configured`.
