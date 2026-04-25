import createGlobe from "cobe";
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { buildNightforceApiUrl } from "../lib/nightforceApi";

type ContactMode =
  | "NO_CONTACT"
  | "PRIVATE_CONTACT_AVAILABLE"
  | "PUBLIC_CONTACT_ALLOWED";

export type CobeAmbassadorGlobeProfile = {
  publicId: string;
  displayName: string | null;
  region: string | null;
  country: string | null;
  contactMode: ContactMode | null;
  requestedVisibility?: "public" | "hidden";
};

type CobeAmbassadorGlobeProps = {
  profiles: CobeAmbassadorGlobeProfile[];
  loading?: boolean;
  onViewCountry: (country: string) => void;
};

type CountryPoint = {
  country: string;
  regionCount: number;
  count: number;
  publicProfiles: number;
  anonymousProfiles: number;
  contactEnabledProfiles: number;
  lat: number;
  lng: number;
};

type VisitorActivity = {
  id: string;
  alias: string;
  countryCode: string;
  countryName: string;
  path: string;
  createdAt: string;
};

type VisitorActivityResponse = {
  activities?: VisitorActivity[];
};

const VISITOR_ACTIVITY_REFRESH_MS = 30 * 1000;

const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  malaysia: { lat: 4.21, lng: 101.98 },
  singapore: { lat: 1.35, lng: 103.82 },
  indonesia: { lat: -2.55, lng: 118.02 },
  thailand: { lat: 15.87, lng: 100.99 },
  philippines: { lat: 12.88, lng: 121.77 },
  japan: { lat: 36.2, lng: 138.25 },
  india: { lat: 20.59, lng: 78.96 },

  "united kingdom": { lat: 55.38, lng: -3.44 },
  germany: { lat: 51.17, lng: 10.45 },
  france: { lat: 46.23, lng: 2.21 },
  netherlands: { lat: 52.13, lng: 5.29 },
  spain: { lat: 40.46, lng: -3.75 },
  nigeria: { lat: 9.08, lng: 8.68 },
  morocco: { lat: 31.79, lng: -7.09 },
  "south africa": { lat: -30.56, lng: 22.94 },

  brazil: { lat: -14.24, lng: -51.93 },
  mexico: { lat: 23.63, lng: -102.55 },
  argentina: { lat: -38.42, lng: -63.62 },
  colombia: { lat: 4.57, lng: -74.3 },

  "united states": { lat: 37.09, lng: -95.71 },
  canada: { lat: 56.13, lng: -106.35 },
};

const FALLBACK_POINTS: CountryPoint[] = [
  {
    country: "Malaysia",
    regionCount: 1,
    count: 1,
    publicProfiles: 1,
    anonymousProfiles: 0,
    contactEnabledProfiles: 1,
    lat: 4.21,
    lng: 101.98,
  },
  {
    country: "United States",
    regionCount: 1,
    count: 1,
    publicProfiles: 1,
    anonymousProfiles: 0,
    contactEnabledProfiles: 1,
    lat: 37.09,
    lng: -95.71,
  },
  {
    country: "Germany",
    regionCount: 1,
    count: 1,
    publicProfiles: 1,
    anonymousProfiles: 0,
    contactEnabledProfiles: 1,
    lat: 51.17,
    lng: 10.45,
  },
];

function getCountryCoordinates(country: string, index: number) {
  const key = country.trim().toLowerCase();
  const stored = COUNTRY_COORDINATES[key];

  if (stored) return stored;

  return {
    lat: 10 + index * 7,
    lng: -120 + index * 35,
  };
}

function buildCountryPoints(
  profiles: CobeAmbassadorGlobeProfile[],
): CountryPoint[] {
  const byCountry = new Map<string, CobeAmbassadorGlobeProfile[]>();

  for (const profile of profiles) {
    if (!profile.country) continue;

    const current = byCountry.get(profile.country) ?? [];
    current.push(profile);
    byCountry.set(profile.country, current);
  }

  return Array.from(byCountry.entries())
    .map(([country, countryProfiles], index) => {
      const regions = new Set(
        countryProfiles
          .map((profile) => profile.region)
          .filter((region): region is string => Boolean(region)),
      );

      const contactEnabled = countryProfiles.filter(
        (profile) =>
          profile.contactMode === "PUBLIC_CONTACT_ALLOWED" ||
          profile.contactMode === "PRIVATE_CONTACT_AVAILABLE",
      );

      const coordinates = getCountryCoordinates(country, index);

      return {
        country,
        regionCount: regions.size,
        count: countryProfiles.length,
        publicProfiles: countryProfiles.filter(
          (profile) => profile.requestedVisibility === "public",
        ).length,
        anonymousProfiles: countryProfiles.filter(
          (profile) => !profile.displayName,
        ).length,
        contactEnabledProfiles: contactEnabled.length,
        lat: coordinates.lat,
        lng: coordinates.lng,
      };
    })
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
}

function formatVisitorActivityTime(createdAt: string): string {
  const activityTime = Date.parse(createdAt);

  if (!Number.isFinite(activityTime)) {
    return "recently";
  }

  const diffMs = Date.now() - activityTime;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `${diffDays}d ago`;
}

function getVisitorActivityCountry(activity: VisitorActivity): string {
  if (activity.countryName && activity.countryName !== "Unknown") {
    return activity.countryName;
  }

  if (activity.countryCode && activity.countryCode !== "XX") {
    return activity.countryCode;
  }

  return "Unknown";
}

function getStatValue(loading: boolean | undefined, value: number): string {
  if (loading) return "…";
  return value.toLocaleString();
}

function getMarkerId(country: string): string {
  return country
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    malaysia: "🇲🇾",
    singapore: "🇸🇬",
    indonesia: "🇮🇩",
    thailand: "🇹🇭",
    philippines: "🇵🇭",
    japan: "🇯🇵",
    india: "🇮🇳",
    "united kingdom": "🇬🇧",
    germany: "🇩🇪",
    france: "🇫🇷",
    netherlands: "🇳🇱",
    spain: "🇪🇸",
    nigeria: "🇳🇬",
    morocco: "🇲🇦",
    "south africa": "🇿🇦",
    brazil: "🇧🇷",
    mexico: "🇲🇽",
    argentina: "🇦🇷",
    colombia: "🇨🇴",
    "united states": "🇺🇸",
    canada: "🇨🇦",
    "united arab emirates": "🇦🇪",
  };

  return flags[country.trim().toLowerCase()] ?? "✦";
}

function getFlagEmojiFromCountryCode(countryCode: string | null | undefined): string {
  const normalizedCountryCode = countryCode?.trim().toUpperCase() ?? "";

  if (
    !/^[A-Z]{2}$/.test(normalizedCountryCode) ||
    normalizedCountryCode === "XX"
  ) {
    return "✦";
  }

  const codePoints = [...normalizedCountryCode].map(
    (character) => 127397 + character.charCodeAt(0),
  );

  return String.fromCodePoint(...codePoints);
}

function getVisitorActivityFlag(activity: VisitorActivity): string {
  const flagFromCountryCode = getFlagEmojiFromCountryCode(activity.countryCode);

  if (flagFromCountryCode !== "✦") {
    return flagFromCountryCode;
  }

  return getCountryFlag(getVisitorActivityCountry(activity));
}

function getRegionIcon(region: string): string {
  const key = region.trim().toLowerCase();

  if (key.includes("apac") || key.includes("asia")) return "🌏";
  if (key.includes("emea") || key.includes("europe")) return "🌍";
  if (key.includes("amer")) return "🌎";
  if (key.includes("latam")) return "🌎";
  if (key.includes("global")) return "✦";

  return "◈";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const DEFAULT_GLOBE_ZOOM = 0.63;

export function CobeAmbassadorGlobe({
  profiles,
  loading,
  onViewCountry,
}: CobeAmbassadorGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const visitorActivityScrollRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const phiRef = useRef(0);
  const thetaRef = useRef(0.22);
  const zoomRef = useRef(DEFAULT_GLOBE_ZOOM);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 620 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_GLOBE_ZOOM);
  const [countryPanelExpanded, setCountryPanelExpanded] = useState(false);
  const [visitorActivity, setVisitorActivity] = useState<VisitorActivity[]>([]);
  const [visitorActivityLoading, setVisitorActivityLoading] = useState(true);
  const [visitorActivityError, setVisitorActivityError] = useState(false);

  const countryPoints = useMemo(() => buildCountryPoints(profiles), [profiles]);

  const displayPoints =
    countryPoints.length > 0 ? countryPoints : FALLBACK_POINTS;

  const selectedCountryData = useMemo(() => {
    if (!selectedCountry) return null;

    return (
      displayPoints.find((point) => point.country === selectedCountry) ?? null
    );
  }, [displayPoints, selectedCountry]);

  const anonymousProfiles = useMemo(() => {
    return profiles.filter((profile) => !profile.displayName).length;
  }, [profiles]);

  const hiddenProfiles = useMemo(() => {
    return profiles.filter(
      (profile) => profile.requestedVisibility === "hidden",
    ).length;
  }, [profiles]);

  const publicProfiles = useMemo(() => {
    return profiles.filter(
      (profile) => profile.requestedVisibility === "public",
    ).length;
  }, [profiles]);

  const countriesRepresented = useMemo(() => {
    return new Set(
      profiles
        .map((profile) => profile.country)
        .filter((country): country is string => Boolean(country)),
    ).size;
  }, [profiles]);

  const regionsRepresented = useMemo(() => {
    return new Set(
      profiles
        .map((profile) => profile.region)
        .filter((region): region is string => Boolean(region)),
    ).size;
  }, [profiles]);

  const displayedVisitorActivity = useMemo(() => {
    return [...visitorActivity].reverse();
  }, [visitorActivity]);

  const cobeMarkers = useMemo(() => {
    return displayPoints.map((point) => ({
      location: [point.lat, point.lng] as [number, number],
      size: Math.min(0.085, 0.035 + point.count * 0.004),
      id: getMarkerId(point.country),
    }));
  }, [displayPoints]);

  const topCountryChoices = useMemo(() => {
    return displayPoints;
  }, [displayPoints]);

  const topCountryChips = useMemo(() => {
    return displayPoints.slice(0, 6);
  }, [displayPoints]);

  const topRegionChips = useMemo(() => {
    const byRegion = new Map<string, number>();

    for (const profile of profiles) {
      if (!profile.region) continue;

      byRegion.set(profile.region, (byRegion.get(profile.region) ?? 0) + 1);
    }

    return Array.from(byRegion.entries())
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region))
      .slice(0, 6);
  }, [profiles]);

  useEffect(() => {
  let cancelled = false;

  async function loadVisitorActivity({
    silent = false,
  }: {
    silent?: boolean;
  } = {}) {
    if (!silent) {
      setVisitorActivityLoading(true);
    }

    try {
      const response = await fetch(
        buildNightforceApiUrl("/api/nightforce/visitor-activity/recent?limit=8"),
      );

      if (!response.ok) {
        throw new Error("Failed to load visitor activity");
      }

      const payload = (await response.json()) as VisitorActivityResponse;
      const activities = Array.isArray(payload.activities)
        ? payload.activities
        : [];

      if (cancelled) {
        return;
      }

      setVisitorActivity(activities);
      setVisitorActivityError(false);
    } catch {
      if (!cancelled) {
        setVisitorActivityError(true);
      }
    } finally {
      if (!cancelled && !silent) {
        setVisitorActivityLoading(false);
      }
    }
  }

  void loadVisitorActivity();

  const delayedRefreshId = window.setTimeout(() => {
    void loadVisitorActivity({ silent: true });
  }, 1000);

  const intervalId = window.setInterval(() => {
    void loadVisitorActivity({ silent: true });
  }, VISITOR_ACTIVITY_REFRESH_MS);

  return () => {
    cancelled = true;
    window.clearTimeout(delayedRefreshId);
    window.clearInterval(intervalId);
  };
}, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function syncReducedMotion() {
      setReducedMotion(mediaQuery.matches);
    }

    syncReducedMotion();
    mediaQuery.addEventListener("change", syncReducedMotion);

    return () => {
      mediaQuery.removeEventListener("change", syncReducedMotion);
    };
  }, []);

  useEffect(() => {
    const maybeElement = containerRef.current;
    if (!maybeElement) return;

    const observedElement: HTMLDivElement = maybeElement;

    function syncSize() {
      setDimensions({
        width: observedElement.clientWidth || 960,
        height: observedElement.clientHeight || 620,
      });
    }

    syncSize();

    const observer = new ResizeObserver(syncSize);
    observer.observe(observedElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    function handleNativeWheel(event: WheelEvent) {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        target.closest("[data-horizontal-scroll], [data-vertical-scroll]")
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      applyGlobeZoom(event.deltaY);
    }

    element.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => {
      element.removeEventListener("wheel", handleNativeWheel);
    };
  }, []);

  useEffect(() => {
    function handleWindowPointerUp() {
      stopGlobeDrag();
    }

    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("blur", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("blur", handleWindowPointerUp);
    };
  }, []);

  useEffect(() => {
    const element = visitorActivityScrollRef.current;
    if (!element) return;

    element.scrollTop = element.scrollHeight;
  }, [displayedVisitorActivity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frameId = 0;

    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(dimensions.width, 320);
    const height = Math.max(dimensions.height, 420);
    const globeSize = Math.min(width, height) * (width < 768 ? 1.05 : 1.12);

    const baseScale = globeSize / Math.min(width, height);

    const globe = createGlobe(canvas, {
      devicePixelRatio,
      width: width * devicePixelRatio,
      height: height * devicePixelRatio,
      phi: phiRef.current,
      theta: thetaRef.current,
      dark: 1,
      diffuse: 1.8,
      mapSamples: 24000,
      mapBrightness: 7.4,
      mapBaseBrightness: 0.02,
      baseColor: [0.28, 0.95, 0.72],
      markerColor: [0.3, 1, 0.65],
      glowColor: [0.2, 0.95, 0.6],
      markers: cobeMarkers,
      markerElevation: 0.03,
      scale: baseScale * zoomRef.current,
      offset: width >= 768 ? [0, 8] : [0, 92],
      opacity: 0.98,
      context: {
        alpha: true,
        antialias: true,
      },
    });

    function animate(timestamp = 0) {
      if (!reducedMotion && !isDraggingRef.current) {
        phiRef.current += 0.0022;
      }

      const pulse = reducedMotion
        ? 1
        : 1 + Math.sin(timestamp * 0.0022) * 0.16;

      const pulsingMarkers = cobeMarkers.map((marker) => ({
        ...marker,
        size: marker.size * pulse,
      }));

      globe.update({
        phi: phiRef.current,
        theta: thetaRef.current,
        scale: baseScale * zoomRef.current,
        markers: pulsingMarkers,
      });

      frameId = requestAnimationFrame(animate);
    }

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      globe.destroy();
    };
  }, [cobeMarkers, dimensions.height, dimensions.width, reducedMotion]);

  function handleResetGlobe() {
    setSelectedCountry(null);
    phiRef.current = 0;
    thetaRef.current = 0.22;
    zoomRef.current = DEFAULT_GLOBE_ZOOM;
    setZoomLevel(DEFAULT_GLOBE_ZOOM);
  }

  function handleGlobePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    isDraggingRef.current = true;
    lastPointerRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleGlobePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current || !lastPointerRef.current) return;

    const deltaX = event.clientX - lastPointerRef.current.x;
    const deltaY = event.clientY - lastPointerRef.current.y;

    phiRef.current += deltaX * 0.006;
    thetaRef.current = clamp(thetaRef.current + deltaY * 0.003, -0.75, 0.75);

    lastPointerRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  function stopGlobeDrag() {
    isDraggingRef.current = false;
    lastPointerRef.current = null;
  }

  function handleGlobePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    stopGlobeDrag();

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function applyGlobeZoom(deltaY: number) {
    const nextZoom = clamp(zoomRef.current - deltaY * 0.0008, 0.48, 1.55);

    zoomRef.current = nextZoom;
    setZoomLevel(nextZoom);
  }

  return (
    <section id="globe" className="mt-8">
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <h2 className="text-[11px] font-mono font-semibold text-zinc-300">
              Ambassador Globe
            </h2>
            <p className="mt-1 text-[10px] font-mono text-zinc-600">
              Profile distribution
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetGlobe}
            className="rounded-md border border-zinc-700 px-2.5 py-1.5 text-[10px] font-mono text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
          >
            Reset
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative min-h-[760px] overflow-hidden bg-[#050708] md:min-h-[640px]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.16),transparent_27%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.07),transparent_44%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,7,8,0.20)_46%,rgba(5,7,8,0.86)_100%)]" />

          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage: [
                "radial-gradient(circle at 9% 18%, rgba(255,255,255,0.30) 0 1px, transparent 2px)",
                "radial-gradient(circle at 17% 67%, rgba(255,255,255,0.18) 0 1px, transparent 2px)",
                "radial-gradient(circle at 28% 35%, rgba(134,239,172,0.28) 0 1px, transparent 3px)",
                "radial-gradient(circle at 39% 82%, rgba(255,255,255,0.18) 0 1px, transparent 2px)",
                "radial-gradient(circle at 52% 22%, rgba(255,255,255,0.20) 0 1px, transparent 2px)",
                "radial-gradient(circle at 63% 72%, rgba(134,239,172,0.28) 0 1px, transparent 3px)",
                "radial-gradient(circle at 78% 31%, rgba(255,255,255,0.26) 0 1px, transparent 2px)",
                "radial-gradient(circle at 88% 58%, rgba(134,239,172,0.22) 0 1px, transparent 3px)",
                "radial-gradient(circle at 94% 84%, rgba(255,255,255,0.18) 0 1px, transparent 2px)",
              ].join(", "),
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.035)_1px,transparent_1px)] [background-size:34px_34px] opacity-10" />

          <div className="absolute left-4 right-4 top-4 z-20 rounded-2xl border border-zinc-800/70 bg-[#1d1d1f]/55 p-3 shadow-2xl backdrop-blur-md md:right-auto md:w-[345px]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 truncate text-[12px] font-mono font-bold text-zinc-100">
                Nightforce
                <span className="mx-1 text-zinc-600">|</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Directory
                </span>
              </div>

              <span className="shrink-0 rounded-full border border-emerald-800/70 bg-emerald-950/70 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wide text-emerald-300">
                synced
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2 border-b border-zinc-800 pb-1.5 text-[11px] font-mono text-zinc-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.85)]" />
              </span>
              <span>
                <span className="font-semibold text-white">
                  {getStatValue(loading, profiles.length)}
                </span>{" "}
                verified profiles across{" "}
                <span className="font-semibold text-white">
                  {getStatValue(loading, countriesRepresented)}
                </span>{" "}
                countries
              </span>
            </div>

            <div className="mt-1.5 space-y-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="shrink-0 text-[10px] leading-none font-mono text-zinc-500">
                  Profiles:
                </div>

                <div
                  data-horizontal-scroll
                  onWheel={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.scrollLeft +=
                      event.deltaY + event.deltaX;
                  }}
                  className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {[
                    {
                      label: "Public",
                      value: getStatValue(loading, publicProfiles),
                    },
                    {
                      label: "Anonymous",
                      value: getStatValue(loading, anonymousProfiles),
                    },                   
                    {
                      label: "Hidden",
                      value: getStatValue(loading, hiddenProfiles),
                    },
                  ].map((stat) => (
                    <span
                      key={stat.label}
                      className="shrink-0 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 text-[10px] font-mono text-zinc-400"
                    >
                      <span className="font-semibold text-white">
                        {stat.value}
                      </span>{" "}
                      {stat.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <div className="shrink-0 text-[10px] leading-none font-mono text-zinc-500">
                  Countries:
                </div>

                <div
                  data-horizontal-scroll
                  onWheel={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.scrollLeft +=
                      event.deltaY + event.deltaX;
                  }}
                  className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {topCountryChips.map((point) => (
                    <span
                      key={point.country}
                      className="shrink-0 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 text-[10px] font-mono text-zinc-300"
                    >
                      <span className="mr-1">{getCountryFlag(point.country)}</span>
                      <span className="font-semibold text-white">
                        {point.country}
                      </span>{" "}
                      <span className="text-zinc-500">({point.count})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <div className="shrink-0 text-[10px] leading-none font-mono text-zinc-500">
                  Regions:
                </div>

                <div
                  data-horizontal-scroll
                  onWheel={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.scrollLeft +=
                      event.deltaY + event.deltaX;
                  }}
                  className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {topRegionChips.length > 0 ? (
                    topRegionChips.map((region) => (
                      <span
                        key={region.region}
                        className="shrink-0 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[10px] font-mono text-zinc-300"
                      >
                        <span className="mr-1">{getRegionIcon(region.region)}</span>
                        <span className="font-semibold text-white">
                          {region.region}
                        </span>{" "}
                        <span className="text-zinc-500">({region.count})</span>
                      </span>
                    ))
                  ) : (
                    <span className="shrink-0 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 text-[10px] font-mono text-zinc-500">
                      No regions yet
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-zinc-800/70 bg-[#1d1d1f]/55 p-2 shadow-2xl backdrop-blur-md md:right-auto md:w-[400px]">
  <div className="mb-1 flex items-center justify-between gap-3 border-b border-zinc-800/70 pb-1">
    <div className="min-w-0 text-[10px] font-mono uppercase tracking-wide text-zinc-500">
      Visitor activity
    </div>

    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wide text-emerald-300">
      country-level
    </span>
  </div>

  <div
    ref={visitorActivityScrollRef}
    data-vertical-scroll
    onWheel={(event) => {
      event.stopPropagation();
    }}
    className="max-h-[104px] space-y-0.5 overflow-y-auto pr-2 [scrollbar-width:thin]"
  >
    {visitorActivityLoading && displayedVisitorActivity.length === 0 ? (
      <div className="rounded-md border border-zinc-800/70 bg-zinc-950/45 px-2 py-2 text-[11px] font-mono text-zinc-500">
        Loading recent country-level activity…
      </div>
    ) : visitorActivityError && displayedVisitorActivity.length === 0 ? (
      <div className="rounded-md border border-zinc-800/70 bg-zinc-950/45 px-2 py-2 text-[11px] font-mono text-zinc-500">
        Visitor activity is unavailable right now.
      </div>
    ) : displayedVisitorActivity.length === 0 ? (
      <div className="rounded-md border border-zinc-800/70 bg-zinc-950/45 px-2 py-2 text-[11px] font-mono text-zinc-500">
        No recent activity yet.
      </div>
    ) : (
      displayedVisitorActivity.map((activity) => {
        const country = getVisitorActivityCountry(activity);

        return (
          <div
            key={activity.id}
            className="group flex items-start gap-1 rounded-md border border-transparent px-1 py-[1px] transition-colors hover:border-zinc-800/80 hover:bg-zinc-950/45"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="mt-[2px] h-3 w-3 shrink-0 text-zinc-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            </svg>

            <div className="min-w-0 flex-1">
              <div className="text-[11px] leading-[14px] text-zinc-400">
                <span className="font-mono font-semibold text-white">
                  {activity.alias}
                </span>{" "}
                <span className="text-zinc-500">from</span>{" "}
                <span className="font-mono font-semibold text-white">
                  {getVisitorActivityFlag(activity)} {country}
                </span>{" "}
                <span className="text-zinc-500">visited</span>{" "}
                <span className="rounded bg-zinc-950/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                  {activity.path}
                </span>
              </div>
              <div className="text-[10px] font-mono leading-none text-zinc-600">
                {formatVisitorActivityTime(activity.createdAt)}
              </div>
            </div>

            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/90" />
          </div>
        );
      })
    )}
  </div>
</div>

          <div className="absolute right-4 top-[365px] z-20 w-[calc(100%-2rem)] rounded-xl border border-zinc-800/70 bg-[#1d1d1f]/55 p-4 shadow-2xl backdrop-blur-md md:top-4 md:w-[300px]">
            {selectedCountryData ? (
              <>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wide text-zinc-600">
                      Selected country
                    </div>
                    <div className="mt-1 text-sm font-mono font-semibold text-white">
                      {selectedCountryData.country}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCountry(null)}
                    className="text-[11px] font-mono text-zinc-600 hover:text-zinc-300"
                  >
                    close
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Ambassadors",
                      value: selectedCountryData.count.toLocaleString(),
                    },
                    {
                      label: "Public",
                      value: selectedCountryData.publicProfiles.toLocaleString(),
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2"
                    >
                      <div className="text-sm font-mono font-semibold text-white">
                        {stat.value}
                      </div>
                      <div className="mt-0.5 text-[10px] font-mono text-zinc-600">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onViewCountry(selectedCountryData.country)}
                  className="mt-3 flex w-full items-center justify-center rounded-lg border border-emerald-900 bg-zinc-950 px-3 py-2 text-[11px] font-mono text-emerald-300 transition-colors hover:border-emerald-500 hover:text-white"
                >
                  View profiles →
                </button>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase tracking-wide text-zinc-600">
                      Ambassador countries
                    </div>
                    <div className="mt-1 text-sm font-mono font-semibold text-white">
                      Explore directory
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCountryPanelExpanded((current) => !current)
                    }
                    className="shrink-0 rounded-md border border-zinc-800 bg-zinc-950/80 px-2 py-1 text-[10px] font-mono text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
                    aria-expanded={countryPanelExpanded}
                  >
                    {countryPanelExpanded ? "collapse" : "expand"}
                  </button>
                </div>

                {countryPanelExpanded ? (
                  <>
                    <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                      Select a country below to view its ambassador summary.
                    </p>

                    <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/90 px-3 py-2 text-[10px] font-mono text-zinc-500">
                      Zoom: {Math.round(zoomLevel * 100)}%
                    </div>

                    <div
                      data-vertical-scroll
                      onWheel={(event) => {
                        event.stopPropagation();
                      }}
                      className="mt-3 max-h-[230px] space-y-2 overflow-y-auto pr-2 [scrollbar-width:thin]"
                    >
                      {topCountryChoices.map((point) => (
                        <button
                          key={point.country}
                          type="button"
                          onClick={() => setSelectedCountry(point.country)}
                          className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/90 px-3 py-2 text-left transition-colors hover:border-emerald-700"
                        >
                          <span className="min-w-0 truncate text-[11px] font-mono text-zinc-300">
                            {point.country}
                          </span>
                          <span className="ml-3 shrink-0 text-[10px] font-mono text-emerald-400">
                            {point.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-[10px] font-mono text-zinc-500">
                    {topCountryChoices.length} countries available · Zoom{" "}
                    {Math.round(zoomLevel * 100)}%
                  </div>
                )}
              </>
            )}
          </div>

          <div
            className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
            onPointerDown={handleGlobePointerDown}
            onPointerMove={handleGlobePointerMove}
            onPointerUp={handleGlobePointerUp}
            onPointerCancel={handleGlobePointerUp}
            onLostPointerCapture={stopGlobeDrag}
            style={{ touchAction: "none" }}
            aria-label="Interactive ambassador globe"
          >
            <canvas
              ref={canvasRef}
              className="h-full w-full"
              style={{
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
              }}
            />
          </div>

        </div>
      </div>
    </section>
  );
}