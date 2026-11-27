const SHARED_SECRET_HEADER = "x-bff-shared-secret";

type SkeletonQueryResult = {
  data?: {
    skeleton: {
      message: string;
    };
  };
  errors?: Array<{ message: string }>;
};

export async function fetchSkeletonMessage(): Promise<string> {
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
        query Skeleton {
          skeleton {
            message
          }
        }
      `,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`BFF request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as SkeletonQueryResult;

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  const message = payload.data?.skeleton.message;
  if (!message) {
    throw new Error("BFF response missing skeleton.message");
  }

  return message;
}
