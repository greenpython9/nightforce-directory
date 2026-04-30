import {
  Component,
  lazy,
  Suspense,
  useState,
  type ErrorInfo,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { MIDNAMES_ENABLED } from "../services/midnamesConfig";
import { getUsableNightDomain } from "../services/nightDomain";

const ENABLE_INTERACTIVE_MIDNAMES =
  import.meta.env.VITE_ENABLE_INTERACTIVE_MIDNAMES === "true";

type TopLevelAwaitModule = {
  __tla?: Promise<unknown>;
};

const LazyMidnamesModal = lazy(async () => {
  const module = await import("./MidnamesModal");

  await (module as typeof module & TopLevelAwaitModule).__tla;

  return {
    default: module.MidnamesModal,
  };
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unknown .night modal load error.";
}

interface MidnamesModalErrorBoundaryProps {
  children: ReactNode;
  domain: string;
  onClose: () => void;
}

interface MidnamesModalErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

class MidnamesModalErrorBoundary extends Component<
  MidnamesModalErrorBoundaryProps,
  MidnamesModalErrorBoundaryState
> {
  state: MidnamesModalErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
  };

  static getDerivedStateFromError(
    error: unknown,
  ): MidnamesModalErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: getErrorMessage(error),
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    console.error("Midnames modal failed to load safely:", error, errorInfo);
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-red-900/50 bg-zinc-950 px-5 py-4 text-sm text-zinc-300 shadow-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-red-300">
            .night profile unavailable
          </p>

          <h2 className="mt-2 text-base font-semibold text-white">
            Could not safely open {this.props.domain}
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            The public .night value is still visible, but the interactive
            Midnames preview could not load in this browser session.
          </p>

          {this.state.errorMessage && (
            <p className="mt-3 break-words rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-zinc-500">
              {this.state.errorMessage}
            </p>
          )}

          <button
            type="button"
            onClick={this.props.onClose}
            className="mt-4 rounded-full border border-white/10 px-4 py-2 text-xs font-mono text-zinc-300 transition hover:border-white/20 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
}

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

  if (!ENABLE_INTERACTIVE_MIDNAMES) {
    return (
      <span
        className={["cursor-default", className].filter(Boolean).join(" ")}
        aria-label={ariaLabel ?? `${usableDomain} .night identity`}
        title={`${usableDomain} .night identity`}
      >
        {children ?? ".night"}
      </span>
    );
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={["cursor-pointer", className].filter(Boolean).join(" ")}
        aria-label={ariaLabel ?? `Open ${usableDomain} Midnames profile`}
      >
        {children ?? ".night"}
      </button>

      {isOpen && (
        <MidnamesModalErrorBoundary
          domain={usableDomain}
          onClose={handleClose}
        >
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
              onClose={handleClose}
            />
          </Suspense>
        </MidnamesModalErrorBoundary>
      )}
    </>
  );
}