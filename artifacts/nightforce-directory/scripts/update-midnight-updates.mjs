import { access, mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BLOG_URL = "https://midnight.network/blog";
const MAX_POSTS_TO_STORE = 12;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, "../public/midnight-updates.json");
const tempOutputPath = `${outputPath}.tmp`;

async function hasExistingOutputFile() {
  try {
    await access(outputPath);
    return true;
  } catch {
    return false;
  }
}

const fallbackImageUrl =
  "https://midnight.network/_next/image?q=75&url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2F330xhmya%2Fproduction%2F74d7348c5da8570d4657d5e55bb965d9d1eea723-2160x2160.jpg&w=1080";

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, " "));
}

function getMetaContent(html, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escapedName}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escapedName}["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return decodeHtml(match[1]);
    }
  }

  return "";
}

function getAllMetaContents(html, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const results = [];

  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escapedName}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      "gi",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escapedName}["'][^>]*>`,
      "gi",
    ),
  ];

  for (const pattern of patterns) {
    let match;

    while ((match = pattern.exec(html)) !== null) {
      if (match[1]) {
        results.push(decodeHtml(match[1]));
      }
    }
  }

  return Array.from(new Set(results));
}

function getFirstHeading(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

  if (!match?.[1]) {
    return "";
  }

  return stripTags(match[1]);
}

function cleanTitle(value) {
  return value
    .replace(/^Midnight blog\s*\|\s*/i, "")
    .replace(/\s*\|\s*Midnight$/i, "")
    .trim();
}

function getTextDate(html) {
  const text = stripTags(html);
  const match = text.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\s+20\d{2}\b/,
  );

  return match?.[0] ?? "";
}

function formatDate(value) {
  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(parsed));
}

function inferTag(title, tags) {
  const cleanTags = tags.filter(Boolean);

  if (cleanTags.length > 0) {
    return cleanTags[0];
  }

  const normalized = title.toLowerCase();

  if (normalized.includes("state of the network")) {
    return "Network Updates";
  }

  if (
    normalized.includes("developer") ||
    normalized.includes("dust") ||
    normalized.includes("dapp")
  ) {
    return "Developers";
  }

  if (
    normalized.includes("partner") ||
    normalized.includes("alliance") ||
    normalized.includes("bank")
  ) {
    return "Ecosystem Partners";
  }

  if (normalized.includes("night")) {
    return "NIGHT";
  }

  return "Blog";
}

function normalizeUrl(value) {
  return new URL(decodeHtml(value), BLOG_URL).toString();
}

function extractBlogPostUrls(html) {
  const urls = [];
  const seen = new Set();
  const hrefPattern = /href=["']([^"']*\/blog\/[^"']*)["']/gi;

  let match;

  while ((match = hrefPattern.exec(html)) !== null) {
    const rawHref = match[1];

    try {
      const url = new URL(decodeHtml(rawHref), BLOG_URL);

      if (url.hostname !== "midnight.network") {
        continue;
      }

      if (!url.pathname.startsWith("/blog/")) {
        continue;
      }

      const slug = url.pathname.replace(/^\/blog\//, "").replace(/\/$/, "");

      if (!slug || slug.includes("/")) {
        continue;
      }

      const href = `https://midnight.network/blog/${slug}`;

      if (!seen.has(href)) {
        seen.add(href);
        urls.push(href);
      }
    } catch {
      // Ignore malformed links.
    }
  }

  return urls;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; NightforceDirectoryUpdater/1.0; +https://nightforce.local)",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function parsePost(url) {
  const html = await fetchText(url);

  const title =
    cleanTitle(getMetaContent(html, "og:title")) ||
    cleanTitle(getMetaContent(html, "twitter:title")) ||
    cleanTitle(getFirstHeading(html));

  const excerpt =
    getMetaContent(html, "og:description") ||
    getMetaContent(html, "description") ||
    "Read the latest update from Midnight Network.";

  const rawImage =
    getMetaContent(html, "og:image") ||
    getMetaContent(html, "twitter:image") ||
    fallbackImageUrl;

  const imageUrl = normalizeUrl(rawImage);

  const rawDate =
    getMetaContent(html, "article:published_time") ||
    getMetaContent(html, "date") ||
    getTextDate(html);

  const tags = getAllMetaContents(html, "article:tag");
  const tag = inferTag(title, tags);

  if (!title) {
    throw new Error(`Could not parse title for ${url}`);
  }

  return {
    author: "Midnight",
    source: "Official Blog",
    date: rawDate ? formatDate(rawDate) : "",
    title,
    excerpt,
    href: url,
    tag,
    imageUrl,
  };
}

async function main() {
  console.log(`Fetching Midnight blog index: ${BLOG_URL}`);

  const indexHtml = await fetchText(BLOG_URL);
  const postUrls = extractBlogPostUrls(indexHtml).slice(0, MAX_POSTS_TO_STORE);

  if (postUrls.length === 0) {
    throw new Error("No Midnight blog post URLs found.");
  }

  console.log(`Found ${postUrls.length} post URL(s).`);

  const posts = [];

  for (const url of postUrls) {
    try {
      const post = await parsePost(url);
      posts.push(post);
      console.log(`Parsed: ${post.title}`);
    } catch (error) {
      console.warn(
        `Skipped ${url}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (posts.length === 0) {
    throw new Error("No Midnight blog posts could be parsed.");
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    source: BLOG_URL,
    posts: posts.slice(0, MAX_POSTS_TO_STORE),
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(tempOutputPath, `${JSON.stringify(payload, null, 2)}\n`);
  await rename(tempOutputPath, outputPath);

  console.log(`Wrote ${payload.posts.length} post(s) to ${outputPath}`);
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);

  if (await hasExistingOutputFile()) {
    console.warn(
      `Midnight update skipped: ${message}. Keeping existing midnight-updates.json.`,
    );
    return;
  }

  console.error(error);
  process.exitCode = 1;
});