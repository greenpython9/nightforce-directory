import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request } from "express";

const router: IRouter = Router();

const RETENTION_DAYS = 7;
const MAX_STORED_ACTIVITIES = 100;
const DEFAULT_RETURN_LIMIT = 8;
const MAX_RETURN_LIMIT = 25;

type VisitorActivityRecord = {
  id: string;
  alias: string;
  countryCode: string;
  countryName: string;
  path: string;
  createdAt: string;
};

type JsonRecord = Record<string, unknown>;

const visitorActivities: VisitorActivityRecord[] = [];

const adjectives = [
  "green",
  "blue",
  "silver",
  "amber",
  "quiet",
  "swift",
  "bright",
  "lunar",
  "hidden",
  "brave",
];

const animals = [
  "cobra",
  "otter",
  "falcon",
  "tiger",
  "panda",
  "raven",
  "gecko",
  "lynx",
  "heron",
  "wolf",
];

const countryNamesByCode: Record<string, string> = {
  AE: "United Arab Emirates",
  AR: "Argentina",
  AU: "Australia",
  BD: "Bangladesh",
  BR: "Brazil",
  CA: "Canada",
  CN: "China",
  DE: "Germany",
  DK: "Denmark",
  ES: "Spain",
  FI: "Finland",
  FR: "France",
  GB: "United Kingdom",
  HK: "Hong Kong",
  ID: "Indonesia",
  IN: "India",
  IT: "Italy",
  JP: "Japan",
  KR: "South Korea",
  MX: "Mexico",
  MY: "Malaysia",
  NG: "Nigeria",
  NL: "Netherlands",
  NO: "Norway",
  NZ: "New Zealand",
  PH: "Philippines",
  PK: "Pakistan",
  SA: "Saudi Arabia",
  SE: "Sweden",
  SG: "Singapore",
  TH: "Thailand",
  TW: "Taiwan",
  US: "United States",
  VN: "Vietnam",
  ZA: "South Africa",
  XX: "Unknown",
};

function nowIso(): string {
  return new Date().toISOString();
}

function asRecord(value: unknown): JsonRecord {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as JsonRecord;
  }

  return {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getHeaderValue(req: Request, headerName: string): string | null {
  const value = req.headers[headerName.toLowerCase()];

  if (Array.isArray(value)) {
    return asString(value[0]);
  }

  return asString(value);
}

function normalizeCountryCode(value: string | null): string {
  if (!value) {
    return "XX";
  }

  const countryCode = value.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(countryCode) || countryCode === "T1") {
    return "XX";
  }

  return countryCode;
}

function getCountryFromRequest(req: Request): {
  countryCode: string;
  countryName: string;
} {
  const countryCode = normalizeCountryCode(
    getHeaderValue(req, "cf-ipcountry") ??
      getHeaderValue(req, "x-vercel-ip-country") ??
      getHeaderValue(req, "x-country-code"),
  );

  return {
    countryCode,
    countryName:
      countryNamesByCode[countryCode] ??
      (countryCode === "XX" ? "Unknown" : countryCode),
  };
}

function normalizePath(value: unknown): string {
  const rawPath = asString(value) ?? "/";
  const pathOnly = rawPath.split("?")[0]?.split("#")[0] ?? "/";
  const normalizedPath = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;

  if (normalizedPath.length > 120) {
    return normalizedPath.slice(0, 120);
  }

  return normalizedPath;
}

function makeAlias(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];

  return `${adjective} ${animal}`;
}

function pruneVisitorActivities(): void {
  const cutoffTime = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

  for (let index = visitorActivities.length - 1; index >= 0; index -= 1) {
    const activityTime = Date.parse(visitorActivities[index]?.createdAt ?? "");

    if (!Number.isFinite(activityTime) || activityTime < cutoffTime) {
      visitorActivities.splice(index, 1);
    }
  }

  if (visitorActivities.length > MAX_STORED_ACTIVITIES) {
    visitorActivities.splice(
      0,
      visitorActivities.length - MAX_STORED_ACTIVITIES,
    );
  }
}

function getRecentVisitorActivities(limit: number): VisitorActivityRecord[] {
  pruneVisitorActivities();

  return [...visitorActivities]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

router.post("/nightforce/visitor-activity", (req, res) => {
  const body = asRecord(req.body);
  const { countryCode, countryName } = getCountryFromRequest(req);

  const activity: VisitorActivityRecord = {
    id: randomUUID(),
    alias: makeAlias(),
    countryCode,
    countryName,
    path: normalizePath(body.path),
    createdAt: nowIso(),
  };

  pruneVisitorActivities();
  visitorActivities.push(activity);

  res.status(201).json({
    activity,
  });
});

router.get("/nightforce/visitor-activity/recent", (req, res) => {
  const requestedLimit = Number.parseInt(String(req.query.limit ?? ""), 10);

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), MAX_RETURN_LIMIT)
    : DEFAULT_RETURN_LIMIT;

  res.json({
    activities: getRecentVisitorActivities(limit),
  });
});

export default router;