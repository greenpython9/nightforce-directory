import { useEffect, useMemo, useState } from "react";
import { DomainProfileWidget } from "@midnames/sdk/react/DomainProfileWidget";
import { HolographicCard } from "@midnames/sdk/react/HolographicCard";
import "@midnames/sdk/styles.css";
import "@midnames/sdk/holographic-card.css";

import {
  getMidnamesNetworkLabel,
  getMidnamesProvider,
  isMidnamesPreprod,
  MIDNAMES_ENABLED,
} from "../services/midnames";
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
}: MidnamesModalProps): JSX.Element | null {
  const [widgetError, setWidgetError] = useState<string | null>(null);

  const usableDomain = useMemo(() => getUsableNightDomain(domain), [domain]);
  const provider = useMemo(() => getMidnamesProvider(), []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setWidgetError(null);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!MIDNAMES_ENABLED || !open || !usableDomain) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${usableDomain} Midnames profile`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
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

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-mono text-zinc-400 transition hover:border-white/20 hover:text-white"
            aria-label="Close Midnames profile"
          >
            Close
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-5 py-5">
          {widgetError && (
            <div className="mb-4 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm font-mono text-red-200">
              Could not load this .night profile right now.
            </div>
          )}

          <div className="mx-auto w-full">
            {mode === "card" ? (
              <div className="mx-auto flex max-w-sm justify-center">
                <HolographicCard
                  domain={usableDomain}
                  publicDataProvider={provider}
                  enableMobileTilt={false}
                  contactText="View profile"
                  onContactClick={() => {
                    setWidgetError(null);
                  }}
                  onError={(error) => {
                    console.error("Midnames card error:", error);
                    setWidgetError(error.message);
                  }}
                />
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
