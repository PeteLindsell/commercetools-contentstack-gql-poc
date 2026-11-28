import { createApiBuilderFromCtpClient } from "@commercetools/platform-sdk";
import type { ByProjectKeyRequestBuilder } from "@commercetools/platform-sdk";
import { ClientBuilder } from "@commercetools/ts-client";
import type { CommerceConfig } from "./commerce-config.js";

export function createCommerceApiRoot(
  config: CommerceConfig,
): ByProjectKeyRequestBuilder {
  const client = new ClientBuilder()
    .withProjectKey(config.projectKey)
    .withClientCredentialsFlow({
      host: config.authUrl,
      projectKey: config.projectKey,
      credentials: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      },
      scopes: config.scopes,
      httpClient: fetch,
    })
    .withHttpMiddleware({
      host: config.apiUrl,
      httpClient: fetch,
    })
    .build();

  return createApiBuilderFromCtpClient(client).withProjectKey({
    projectKey: config.projectKey,
  });
}

export function commerceStatusCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  if (
    "body" in error &&
    typeof error.body === "object" &&
    error.body !== null &&
    "statusCode" in error.body &&
    typeof error.body.statusCode === "number"
  ) {
    return error.body.statusCode;
  }
  return undefined;
}

export async function readCommerceBody<T>(
  read: () => Promise<{ body: T }>,
): Promise<T | undefined> {
  try {
    const response = await read();
    return response.body;
  } catch (error) {
    if (commerceStatusCode(error) === 404) {
      return undefined;
    }
    throw error;
  }
}

export function describeCommerceError(error: unknown): string {
  const status = commerceStatusCode(error);
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "commercetools request failed";
  return status ? `${message} (HTTP ${status})` : message;
}
