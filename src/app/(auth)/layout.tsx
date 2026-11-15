import { AuthBrandPanel, AuthMobileBar } from "@/components/features/auth/AuthBrandPanel";
import { LAYOUT } from "@/constants/layout";
import { cn } from "@/lib/utils/cn";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="herbal-gradient flex min-h-screen flex-col lg:grid lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      <AuthMobileBar />
      <AuthBrandPanel />
      <main className={cn(LAYOUT.container, "flex flex-1 items-center justify-center py-6 lg:overflow-y-auto lg:py-8")}>
        {children}
      </main>
    </div>
  );
}
