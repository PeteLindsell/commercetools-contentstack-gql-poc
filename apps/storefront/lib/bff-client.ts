const SHARED_SECRET_HEADER = "x-bff-shared-secret";

export type Homepage = {
  headline: string;
  body: string;
  imageUrl: string | null;
};

type HomepageQueryResult = {
  data?: {
    homepage: Homepage | null;
  };
  errors?: Array<{ message: string }>;
};

export async function fetchHomepage(): Promise<Homepage | null> {
  const bffUrl = process.env.BFF_URL;
  const sharedSecret = process.env.BFF_SHARED_SECRET;

  if (!bffUrl) {
    throw new Error("BFF_URL is required");
  }
  if (!sharedSecret) {
    throw new Error("BFF_SHARED_SECRET is required");
  }

  const response = await fetch(bffUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [SHARED_SECRET_HEADER]: sharedSecret,
    },
    body: JSON.stringify({
      query: /* GraphQL */ `
        query Homepage {
          homepage {
            headline
            body
            imageUrl
          }
        }
      `,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`BFF request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as HomepageQueryResult;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  if (!payload.data || !("homepage" in payload.data)) {
    throw new Error("BFF response missing homepage");
  }

  return payload.data.homepage;
}
