export const DEFAULT_LOCALE = "en-GB";
export const DEFAULT_CURRENCY = "GBP";
export const DEFAULT_STORE_KEY = "poc";
export const DEFAULT_CHANNEL_KEY = "poc-retail";

export type CommerceConfig = {
  projectKey: string;
  clientId: string;
  clientSecret: string;
  authUrl: string;
  apiUrl: string;
  locale: string;
  currency: string;
  storeKey: string;
  channelKey: string;
  scopes: string[];
};

function readEnv(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

/**
 * One locale, currency, store, and distribution channel for the whole PoC.
 * Returns undefined when no commercetools credentials are set, so the BFF can
 * still boot for the walking skeleton. A partial credential set is a mistake.
 */
export function readCommerceConfig(
  env: NodeJS.ProcessEnv,
): CommerceConfig | undefined {
  const projectKey = readEnv(env, "CTP_PROJECT_KEY");
  const clientId = readEnv(env, "CTP_CLIENT_ID");
  const clientSecret = readEnv(env, "CTP_CLIENT_SECRET");
  const authUrl = readEnv(env, "CTP_AUTH_URL");
  const apiUrl = readEnv(env, "CTP_API_URL");

  const credentials = [
    ["CTP_PROJECT_KEY", projectKey],
    ["CTP_CLIENT_ID", clientId],
    ["CTP_CLIENT_SECRET", clientSecret],
    ["CTP_AUTH_URL", authUrl],
    ["CTP_API_URL", apiUrl],
  ] as const;
  const missing = credentials
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length === credentials.length) {
    return undefined;
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing commercetools configuration: ${missing.join(", ")}`,
    );
  }
  if (!projectKey || !clientId || !clientSecret || !authUrl || !apiUrl) {
    return undefined;
  }

  const scopes = readEnv(env, "CTP_SCOPES")
    ?.split(",")
    .map((scope) => scope.trim())
    .filter(Boolean) ?? [`manage_project:${projectKey}`];

  return {
    projectKey,
    clientId,
    clientSecret,
    authUrl,
    apiUrl,
    locale: readEnv(env, "CTP_LOCALE") ?? DEFAULT_LOCALE,
    currency: readEnv(env, "CTP_CURRENCY") ?? DEFAULT_CURRENCY,
    storeKey: readEnv(env, "CTP_STORE_KEY") ?? DEFAULT_STORE_KEY,
    channelKey: readEnv(env, "CTP_CHANNEL_KEY") ?? DEFAULT_CHANNEL_KEY,
    scopes,
  };
}
