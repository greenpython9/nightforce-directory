import {
  lazy,
  Suspense,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { MIDNAMES_ENABLED } from "../services/midnamesConfig";
import { getUsableNightDomain } from "../services/nightDomain";

const LazyMidnamesModal = lazy(() =>
  import("./MidnamesModal").then((module) => ({
    default: module.MidnamesModal,
  })),
);

interface MidnamesProfileButtonProps {
  domain: string | null | undefined;
  mode: "full" | "card";
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function MidnamesProfileButton({
  domain,
  mode,
  children,
  className,
  ariaLabel,
}: MidnamesProfileButtonProps): ReactElement | null {
  const [isOpen, setIsOpen] = useState(false);
  const usableDomain = getUsableNightDomain(domain);

  if (!MIDNAMES_ENABLED || !usableDomain) {
    return null;
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className}
        aria-label={ariaLabel ?? `Open ${usableDomain} Midnames profile`}
      >
        {children ?? ".night"}
      </button>

      {isOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
              <div className="rounded-2xl border border-white/10 bg-zinc-950 px-5 py-4 text-sm font-mono text-zinc-300 shadow-2xl">
                Loading .night profile…
              </div>
            </div>
          }
        >
          <LazyMidnamesModal
            open={isOpen}
            domain={usableDomain}
            mode={mode}
            onClose={() => setIsOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
