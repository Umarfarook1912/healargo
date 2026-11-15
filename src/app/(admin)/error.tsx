"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive-soft text-destructive ring-1 ring-destructive/15">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h2 className="font-display text-2xl text-dark">Admin error</h2>
      <p className="text-sm text-muted">Please try again.</p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
