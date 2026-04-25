const DEFAULT_NIGHTFORCE_API_BASE_URL = "http://127.0.0.1:8787";

function normalizeApiBaseUrl(value: string | undefined): string {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return DEFAULT_NIGHTFORCE_API_BASE_URL;
  }

  return trimmedValue.replace(/\/+$/, "");
}

export const NIGHTFORCE_API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_NIGHTFORCE_API_BASE_URL,
);

export function buildNightforceApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${NIGHTFORCE_API_BASE_URL}${normalizedPath}`;
}