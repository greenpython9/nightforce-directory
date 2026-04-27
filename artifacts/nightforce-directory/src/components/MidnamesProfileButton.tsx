import { useState, type MouseEvent, type ReactElement, type ReactNode } from "react";

import { MidnamesModal } from "./MidnamesModal";
import { MIDNAMES_ENABLED } from "../services/midnames";
import { getUsableNightDomain } from "../services/nightDomain";

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

      <MidnamesModal
        open={isOpen}
        domain={usableDomain}
        mode={mode}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
