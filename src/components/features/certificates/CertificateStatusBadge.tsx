import React from "react";
import { CheckCircle2, Clock, AlertCircle, MinusCircle } from "lucide-react";
import type { CertificateStatus } from "@/types/certificate";
import { cn } from "@/lib/utils/cn";

interface CertificateStatusBadgeProps {
  status: CertificateStatus;
  className?: string;
  showIcon?: boolean;
}

export function CertificateStatusBadge({
  status,
  className,
  showIcon = true,
}: CertificateStatusBadgeProps) {
  switch (status) {
    case "verified":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800",
            className,
          )}
        >
          {showIcon && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
          <span>Verified Document</span>
        </span>
      );

    case "pending":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning",
            className,
          )}
        >
          {showIcon && <Clock className="h-3 w-3 text-warning" />}
          <span>Verification Pending</span>
        </span>
      );

    case "not_applicable":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-input bg-cream px-2.5 py-0.5 text-xs font-medium text-muted",
            className,
          )}
        >
          {showIcon && <MinusCircle className="h-3 w-3 text-muted" />}
          <span>Not Applicable</span>
        </span>
      );

    case "placeholder":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-warning/25 bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning",
            className,
          )}
        >
          {showIcon && <AlertCircle className="h-3 w-3 text-warning" />}
          <span>Sample Placeholder</span>
        </span>
      );
  }
}
