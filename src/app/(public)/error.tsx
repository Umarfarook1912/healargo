"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicError({
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
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 py-16 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive-soft text-destructive ring-1 ring-destructive/15">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h2 className="font-display text-2xl text-dark">Something went wrong</h2>
      <p className="text-sm text-muted">Please try again.</p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
