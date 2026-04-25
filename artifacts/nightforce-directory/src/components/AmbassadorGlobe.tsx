import Globe from "react-globe.gl";
import { useEffect, useMemo, useRef, useState } from "react";

type ContactMode =
  | "NO_CONTACT"
  | "PRIVATE_CONTACT_AVAILABLE"
  | "PUBLIC_CONTACT_ALLOWED";

export type AmbassadorGlobeProfile = {
  publicId: string;
  displayName: string | null;
  region: string | null;
  country: string | null;
  contactMode: ContactMode | null;
};

type AmbassadorGlobeProps = {
  profiles: AmbassadorGlobeProfile[];
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

type CountryPinPoint = CountryPoint & {
  isSelected: boolean;
};

type VisitorActivity = {
  name: string;
  country: string;
  path: string;
  time: string;
};

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

function buildCountryPoints(profiles: AmbassadorGlobeProfile[]): CountryPoint[] {
  const byCountry = new Map<string, AmbassadorGlobeProfile[]>();

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
        publicProfiles: countryProfiles.length,
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

function buildVisitorActivity(points: CountryPoint[]): VisitorActivity[] {
  const names = [
    "Brown Capybara",
    "Green Cobra",
    "Blue Otter",
    "Amber Fox",
    "Silver Manta",
  ];

  const paths = ["/", "/directory", "/request-verification", "/profile"];

  const countryPool =
    points.length > 0
      ? points.map((point) => point.country)
      : ["Morocco", "Malaysia", "United States", "Japan"];

  return names.map((name, index) => ({
    name,
    country: countryPool[index % countryPool.length],
    path: paths[index % paths.length],
    time: `${index + 1}m ago`,
  }));
}

function getStatValue(loading: boolean | undefined, value: number): string {
  if (loading) return "…";
  return value.toLocaleString();
}

export function AmbassadorGlobe({
  profiles,
  loading,
  onViewCountry,
}: AmbassadorGlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 620 });
  const [reducedMotion, setReducedMotion] = useState(false);

  const countryPoints = useMemo(() => buildCountryPoints(profiles), [profiles]);

  const displayPoints = countryPoints.length > 0 ? countryPoints : FALLBACK_POINTS;

  const selectedCountryData = useMemo(() => {
    if (!selectedCountry) return null;

    return (
      displayPoints.find((point) => point.country === selectedCountry) ?? null
    );
  }, [displayPoints, selectedCountry]);

  const displayPinPoints = useMemo<CountryPinPoint[]>(() => {
    return displayPoints.map((point) => ({
      ...point,
      isSelected: selectedCountry === point.country,
    }));
  }, [displayPoints, selectedCountry]);

  const anonymousProfiles = useMemo(() => {
    return profiles.filter((profile) => !profile.displayName).length;
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

  const visitorActivity = useMemo(
    () => buildVisitorActivity(displayPoints),
    [displayPoints],
  );

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
    if (!selectedCountry) return;

    const stillExists = displayPoints.some(
      (point) => point.country === selectedCountry,
    );

    if (!stillExists) {
      setSelectedCountry(null);
    }
  }, [displayPoints, selectedCountry]);

  function configureGlobe() {
    const controls = globeRef.current?.controls?.();

    if (controls) {
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = !reducedMotion;
      controls.autoRotateSpeed = 0.22;
      controls.minDistance = 170;
      controls.maxDistance = 620;
    }

    globeRef.current?.pointOfView?.(
      {
        lat: 10,
        lng: 96,
        altitude: dimensions.width < 768 ? 2.18 : 1.32,
      },
      0,
    );

    const globeMaterial = globeRef.current?.globeMaterial?.();

    if (globeMaterial) {
      globeMaterial.color.set("#C7F9E9");
      globeMaterial.emissive.set("#052E16");
      globeMaterial.emissiveIntensity = 0.14;
      globeMaterial.shininess = 0.42;
      globeMaterial.transparent = true;
      globeMaterial.opacity = 0.94;
    }
  }

  function createCountryPinElement(point: CountryPinPoint): HTMLElement {
    const button = document.createElement("button");

    button.type = "button";
    button.title = `${point.country} · ${point.count} ambassador${
      point.count === 1 ? "" : "s"
    }`;
    button.setAttribute(
      "aria-label",
      `Show ${point.country} summary with ${point.count} ambassador${
        point.count === 1 ? "" : "s"
      }`,
    );

    button.className = point.isSelected
      ? "group relative flex h-10 w-10 items-center justify-center rounded-full outline-none"
      : "group relative flex h-8 w-8 items-center justify-center rounded-full outline-none";

    button.innerHTML = `
      <span class="${
        point.isSelected
          ? "absolute inset-0 rounded-full border border-emerald-200/90 bg-emerald-300/20 shadow-[0_0_24px_rgba(57,255,136,0.60)]"
          : "absolute inset-1 rounded-full border border-emerald-300/50 bg-emerald-400/10 shadow-[0_0_16px_rgba(57,255,136,0.36)]"
      }"></span>

      <span class="${
        point.isSelected
          ? "absolute inset-0 rounded-full border border-emerald-300/40 animate-ping"
          : "absolute inset-1 rounded-full border border-emerald-400/25 animate-ping"
      }"></span>

      <span class="${
        point.isSelected
          ? "relative h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,0.85)]"
          : "relative h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(57,255,136,0.70)]"
      }"></span>

      ${
        point.isSelected
          ? `<span class="absolute -right-1 -top-1 rounded-full border border-emerald-300/70 bg-zinc-950 px-1.5 py-0.5 text-[9px] font-mono text-emerald-200 shadow-[0_0_12px_rgba(57,255,136,0.35)]">${point.count}</span>`
          : ""
      }

      <span class="pointer-events-none absolute left-1/2 top-9 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-emerald-900/70 bg-zinc-950/95 px-2 py-1 text-[10px] font-mono text-emerald-100 shadow-xl group-hover:block">
        ${point.country} · ${point.count}
      </span>
    `;

    button.addEventListener("click", () => {
      setSelectedCountry(point.country);
    });

    return button;
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
              Country-level ambassador distribution
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedCountry(null)}
            className="rounded-md border border-zinc-700 px-2.5 py-1.5 text-[10px] font-mono text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
          >
            Reset
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative min-h-[760px] overflow-hidden bg-[#080A0B] md:min-h-[640px]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(16,185,129,0.10),transparent_24%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(6,182,212,0.06),transparent_40%)]" />

          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage: [
                "radial-gradient(circle at 9% 18%, rgba(255,255,255,0.38) 0 1px, transparent 2px)",
                "radial-gradient(circle at 17% 67%, rgba(255,255,255,0.24) 0 1px, transparent 2px)",
                "radial-gradient(circle at 28% 35%, rgba(134,239,172,0.30) 0 1px, transparent 3px)",
                "radial-gradient(circle at 39% 82%, rgba(255,255,255,0.22) 0 1px, transparent 2px)",
                "radial-gradient(circle at 52% 22%, rgba(255,255,255,0.28) 0 1px, transparent 2px)",
                "radial-gradient(circle at 63% 72%, rgba(134,239,172,0.34) 0 1px, transparent 3px)",
                "radial-gradient(circle at 78% 31%, rgba(255,255,255,0.34) 0 1px, transparent 2px)",
                "radial-gradient(circle at 88% 58%, rgba(134,239,172,0.26) 0 1px, transparent 3px)",
                "radial-gradient(circle at 94% 84%, rgba(255,255,255,0.22) 0 1px, transparent 2px)",
              ].join(", "),
            }}
          />

          <div
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              backgroundImage: [
                "radial-gradient(circle at 14% 44%, rgba(34,197,94,0.24) 0 1px, rgba(34,197,94,0.08) 2px, transparent 8px)",
                "radial-gradient(circle at 36% 57%, rgba(255,255,255,0.18) 0 1px, rgba(255,255,255,0.05) 2px, transparent 7px)",
                "radial-gradient(circle at 58% 39%, rgba(34,197,94,0.24) 0 1px, rgba(34,197,94,0.08) 2px, transparent 9px)",
                "radial-gradient(circle at 82% 73%, rgba(255,255,255,0.18) 0 1px, rgba(255,255,255,0.05) 2px, transparent 7px)",
              ].join(", "),
            }}
          />

          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.035)_1px,transparent_1px)] [background-size:34px_34px] opacity-15" />

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_68%_48%,transparent_0%,rgba(8,10,11,0.08)_38%,rgba(8,10,11,0.68)_100%)]" />

          <div className="absolute left-4 right-4 top-4 z-20 rounded-xl border border-zinc-800 bg-zinc-900/95 p-4 backdrop-blur md:right-auto md:w-[300px]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wide text-zinc-600">
                  Directory summary
                </div>
                <div className="mt-1 text-[12px] font-mono font-semibold text-white">
                  Verified ambassadors
                </div>
              </div>

              <span className="inline-flex rounded border border-emerald-800 bg-emerald-950 px-2 py-1 text-[10px] font-mono text-emerald-400">
                live
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: "Verified",
                  value: getStatValue(loading, profiles.length),
                },
                {
                  label: "Public",
                  value: getStatValue(loading, profiles.length),
                },
                {
                  label: "Hidden",
                  value: "—",
                },
                {
                  label: "Anonymous",
                  value: getStatValue(loading, anonymousProfiles),
                },
                {
                  label: "Countries",
                  value: getStatValue(loading, countriesRepresented),
                },
                {
                  label: "Regions",
                  value: getStatValue(loading, regionsRepresented),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2"
                >
                  <div className="text-[15px] font-mono font-semibold text-white">
                    {stat.value}
                  </div>
                  <div className="mt-0.5 text-[10px] font-mono text-zinc-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-20 rounded-xl border border-zinc-800 bg-zinc-900/95 p-4 backdrop-blur md:right-auto md:w-[360px]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wide text-zinc-600">
                  Recent visitor activity
                </div>
                <div className="mt-1 text-[12px] font-mono font-semibold text-white">
                  Visitor stream preview
                </div>
              </div>

              <span className="text-[10px] font-mono text-zinc-600">demo</span>
            </div>

            <div className="space-y-2">
              {visitorActivity.slice(0, 4).map((activity) => (
                <div
                  key={`${activity.name}-${activity.country}-${activity.path}`}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2"
                >
                  <div className="text-[11px] font-mono text-zinc-300">
                    {activity.name}
                    <span className="text-zinc-600"> from </span>
                    {activity.country}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-600">
                    <span>visited {activity.path}</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute right-4 top-[365px] z-20 w-[calc(100%-2rem)] rounded-xl border border-zinc-800 bg-zinc-900/95 p-4 backdrop-blur md:top-4 md:w-[300px]">
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
                      label: "Regions",
                      value: selectedCountryData.regionCount.toLocaleString(),
                    },
                    {
                      label: "Public",
                      value: selectedCountryData.publicProfiles.toLocaleString(),
                    },
                    {
                      label: "Contact",
                      value:
                        selectedCountryData.contactEnabledProfiles.toLocaleString(),
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
                <div className="text-[10px] font-mono uppercase tracking-wide text-zinc-600">
                  Country pin
                </div>
                <div className="mt-1 text-sm font-mono font-semibold text-white">
                  Select a marker
                </div>
                <p className="mt-2 text-[11px] leading-5 text-zinc-500">
                  Click a country marker to open an aggregated country card.
                  Each marker represents all public profiles from that country.
                </p>
              </>
            )}
          </div>

          <div className="absolute inset-0 z-10">
            <Globe
              ref={globeRef}
              width={dimensions.width}
              height={dimensions.height}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
              bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
              showAtmosphere
              showGraticules
              atmosphereColor="#34D399"
              atmosphereAltitude={0.065}
              animateIn={false}
              rendererConfig={{ alpha: true, antialias: true }}
              globeOffset={dimensions.width >= 768 ? [210, 14] : [0, 80]}
              htmlElementsData={displayPinPoints}
              htmlLat="lat"
              htmlLng="lng"
              htmlAltitude={(point) => {
                const countryPoint = point as CountryPinPoint;
                return countryPoint.isSelected ? 0.1 : 0.065;
              }}
              htmlElement={(point) =>
                createCountryPinElement(point as CountryPinPoint)
              }
              htmlElementVisibilityModifier={(element, isVisible) => {
                element.style.opacity = isVisible ? "1" : "0";
                element.style.pointerEvents = isVisible ? "auto" : "none";
              }}
              onGlobeReady={configureGlobe}
            />
          </div>

          <div className="absolute bottom-3 right-3 z-20 rounded border border-emerald-900/60 bg-zinc-900/90 px-2 py-1 text-[10px] font-mono text-emerald-400/80">
            country-level only
          </div>
        </div>
      </div>
    </section>
  );
}