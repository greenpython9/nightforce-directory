import { useEffect, useMemo, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { DomainProfileWidget } from "@midnames/sdk/react/DomainProfileWidget";
import { HolographicCard } from "@midnames/sdk/react/HolographicCard";
import "@midnames/sdk/styles.css";
import "@midnames/sdk/holographic-card.css";

import { getMidnamesProvider } from "../services/midnames";
import {
  getMidnamesNetworkLabel,
  isMidnamesPreprod,
  MIDNAMES_ENABLED,
} from "../services/midnamesConfig";
import { getUsableNightDomain } from "../services/nightDomain";

type MidnamesModalMode = "full" | "card";

interface MidnamesModalProps {
  open: boolean;
  domain: string | null | undefined;
  mode: MidnamesModalMode;
  onClose: () => void;
}

export function MidnamesModal({
  open,
  domain,
  mode,
  onClose,
}: MidnamesModalProps): ReactElement | null {
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<MidnamesModalMode>(mode);

  const usableDomain = useMemo(() => getUsableNightDomain(domain), [domain]);
  const provider = useMemo(() => getMidnamesProvider(), []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setWidgetError(null);
    setActiveMode(mode);

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mode, open, onClose]);

  if (!MIDNAMES_ENABLED || !open || !usableDomain) {
    return null;
  }

  const modal = (
    <div
      className="fixed inset-0 isolate z-[100] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`${usableDomain} Midnames profile`}
      onClick={onClose}
    >
      <div
        className={
          activeMode === "full"
            ? "relative w-full max-w-5xl overflow-visible rounded-2xl border border-emerald-300/15 bg-zinc-950/40 shadow-2xl shadow-emerald-950/30 ring-1 ring-white/10 backdrop-blur-2xl"
            : "relative w-full max-w-3xl overflow-visible rounded-2xl border border-emerald-300/20 bg-zinc-950/35 shadow-2xl shadow-emerald-950/30 ring-1 ring-white/10 backdrop-blur-2xl"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-emerald-300">
              .night identity · {getMidnamesNetworkLabel()}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {usableDomain}
            </h2>
            {isMidnamesPreprod() && (
              <p className="mt-1 text-xs font-mono text-zinc-500">
                Preprod/testnet data may change or reset.
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {activeMode === "full" && mode === "card" && (
              <button
                type="button"
                onClick={() => setActiveMode("card")}
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-mono text-zinc-400 transition hover:border-white/20 hover:text-white"
              >
                Card
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-mono text-zinc-400 transition hover:border-white/20 hover:text-white"
              aria-label="Close Midnames profile"
            >
              Close
            </button>
          </div>
        </div>

        <div
          className={
            activeMode === "card"
              ? "overflow-visible px-5 py-10 sm:px-8 sm:py-14"
              : "max-h-[78vh] overflow-y-auto px-5 py-5"
          }
        >
          {widgetError && (
            <div className="mb-4 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm font-mono text-red-200">
              Could not load this .night profile right now.
            </div>
          )}

          <div className="mx-auto w-full">
            {activeMode === "card" ? (
              <div className="mx-auto flex min-h-[560px] max-w-md items-center justify-center overflow-visible">
                <HolographicCard
                  domain={usableDomain}
                  publicDataProvider={provider}
                  enableMobileTilt={false}
                  contactText="View profile"
                  onContactClick={() => {
                    setWidgetError(null);
                    setActiveMode("full");
                  }}
                  onError={(error) => {
                    console.error("Midnames card error:", error);
                    setWidgetError(error.message);
                  }}
                />
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                <div className="overflow-visible rounded-2xl border border-emerald-300/15 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_56%),rgba(9,9,11,0.28)] px-4 py-6 shadow-xl shadow-emerald-950/20 ring-1 ring-white/5 backdrop-blur-xl">
                  <div className="mx-auto flex min-h-[440px] max-w-sm items-center justify-center overflow-visible">
                    <HolographicCard
                      domain={usableDomain}
                      publicDataProvider={provider}
                      enableMobileTilt={false}
                      contactText="Expand card"
                      onContactClick={() => {
                        setWidgetError(null);
                        setActiveMode("card");
                      }}
                      onError={(error) => {
                        console.error("Midnames full-preview card error:", error);
                        setWidgetError(error.message);
                      }}
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <DomainProfileWidget
                    fullDomain={usableDomain}
                    publicDataProvider={provider}
                    variant="full"
                    theme="dark"
                    customFields={["github", "website", "x", "twitter"]}
                    onError={(error) => {
                      console.error("Midnames profile error:", error);
                      setWidgetError(error.message);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
