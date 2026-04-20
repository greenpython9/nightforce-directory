import type { VerificationStatus } from "../types";

interface StatusBadgeProps {
  status: VerificationStatus;
  className?: string;
}

const statusConfig: Record<VerificationStatus, { label: string; className: string }> = {
  not_verified: {
    label: "Not Verified",
    className: "bg-zinc-800 text-zinc-400 border border-zinc-700",
  },
  pending: {
    label: "Pending Review",
    className: "bg-yellow-950 text-yellow-400 border border-yellow-800",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-950 text-emerald-400 border border-emerald-800",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-950 text-red-400 border border-red-800",
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const { label, className: statusClass } = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium ${statusClass} ${className}`}
    >
      {label}
    </span>
  );
}
