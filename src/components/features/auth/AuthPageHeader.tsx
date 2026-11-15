import Link from "next/link";
import { AUTH_COPY } from "@/constants/auth";
import type { AuthPageHeaderProps, AuthSwitchPromptProps } from "@/types/auth";

export function AuthPageHeader({ title, subtitle }: AuthPageHeaderProps) {
  return (
    <div className="mb-5">
      <span aria-hidden className="mb-3 block h-1 w-10 rounded-full bg-accent" />
      <h1 className="font-display text-[1.75rem] leading-tight tracking-tight text-dark">
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-[var(--shadow-lifted)] sm:p-7">
      {children}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-3.5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-card px-3 text-muted">{AUTH_COPY.orEmail}</span>
      </div>
    </div>
  );
}

export function AuthSwitchPrompt({
  prompt,
  href,
  linkLabel,
}: AuthSwitchPromptProps) {
  return (
    <p className="mt-3 text-center text-sm text-muted">
      {prompt}{" "}
      <Link
        href={href}
        className="font-semibold text-primary underline-offset-4 hover:underline"
      >
        {linkLabel}
      </Link>
    </p>
  );
}
