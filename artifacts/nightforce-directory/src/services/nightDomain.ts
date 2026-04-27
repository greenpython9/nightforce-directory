const NIGHT_DOMAIN_MAX_LENGTH = 253;
const NIGHT_DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export function normalizeNightDomain(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return normalized;
}

export function isValidNightDomain(value: string | null | undefined): boolean {
  const normalized = normalizeNightDomain(value);

  if (!normalized) {
    return false;
  }

  if (
    !normalized.endsWith(".night") ||
    normalized.length > NIGHT_DOMAIN_MAX_LENGTH ||
    normalized.includes("..") ||
    normalized.includes("/") ||
    normalized.includes(":")
  ) {
    return false;
  }

  const domainWithoutTld = normalized.slice(0, -".night".length);
  const labels = domainWithoutTld.split(".");

  return (
    labels.length > 0 &&
    labels.every(
      (label) =>
        label.length > 0 &&
        label.length <= 63 &&
        NIGHT_DOMAIN_LABEL_PATTERN.test(label),
    )
  );
}

export function getUsableNightDomain(value: string | null | undefined): string | null {
  const normalized = normalizeNightDomain(value);

  if (!normalized || !isValidNightDomain(normalized)) {
    return null;
  }

  return normalized;
}
