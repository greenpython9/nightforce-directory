import { useEffect } from "react";

export const SITE_URL = "https://nightforce.cc";
export const SITE_NAME = "nightforce.cc";

type JsonLdValue = Record<string, unknown> | Record<string, unknown>[];

type SEOProps = {
  title: string;
  description: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  robots?: string;
  ogType?: "website" | "article";
  imageUrl?: string;
  jsonLd?: JsonLdValue;
};

function buildAbsoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${normalizedPath}`;
}

function setMetaTag(attributeName: "name" | "property", key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attributeName}="${key}"]`,
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setCanonicalTag(url: string): void {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", url);
}

function setJsonLd(jsonLd?: JsonLdValue): void {
  const existingElement = document.head.querySelector<HTMLScriptElement>(
    'script[data-nightforce-seo="json-ld"]',
  );

  if (!jsonLd) {
    existingElement?.remove();
    return;
  }

  const element = existingElement ?? document.createElement("script");
  element.setAttribute("type", "application/ld+json");
  element.setAttribute("data-nightforce-seo", "json-ld");
  element.textContent = JSON.stringify(jsonLd);

  if (!existingElement) {
    document.head.appendChild(element);
  }
}

export function SEO({
  title,
  description,
  canonicalPath,
  canonicalUrl,
  robots = "index,follow",
  ogType = "website",
  imageUrl,
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    const canonical = canonicalUrl ?? buildAbsoluteUrl(canonicalPath ?? window.location.pathname);
    const absoluteImageUrl = imageUrl ? buildAbsoluteUrl(imageUrl) : undefined;

    document.title = title;

    setMetaTag("name", "description", description);
    setMetaTag("name", "robots", robots);

    setCanonicalTag(canonical);

    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", canonical);
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:site_name", SITE_NAME);

    setMetaTag("name", "twitter:card", absoluteImageUrl ? "summary_large_image" : "summary");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);

    if (absoluteImageUrl) {
      setMetaTag("property", "og:image", absoluteImageUrl);
      setMetaTag("name", "twitter:image", absoluteImageUrl);
    }

    setJsonLd(jsonLd);
  }, [
    title,
    description,
    canonicalPath,
    canonicalUrl,
    robots,
    ogType,
    imageUrl,
    jsonLd,
  ]);

  return null;
}
