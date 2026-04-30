const LOCAL_NIGHTFORCE_API_BASE_URL = "http://127.0.0.1:8787";

function getDefaultNightforceApiBaseUrl(): string {
  return import.meta.env.DEV ? LOCAL_NIGHTFORCE_API_BASE_URL : "";
}

function normalizeApiBaseUrl(value: string | undefined): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return getDefaultNightforceApiBaseUrl();
  }

  if (trimmedValue === "/") {
    return "";
  }

  return trimmedValue.replace(/\/+$/, "");
}

export const NIGHTFORCE_API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_NIGHTFORCE_API_BASE_URL,
);

export function buildNightforceApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!NIGHTFORCE_API_BASE_URL) {
    return normalizedPath;
  }

  return `${NIGHTFORCE_API_BASE_URL}${normalizedPath}`;
}