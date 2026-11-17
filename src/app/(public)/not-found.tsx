import type { Metadata } from "next";
import { NotFoundLandingView } from "@/components/features/not-found/NotFoundLandingView";

export const metadata: Metadata = {
  title: "404 - Page Not Found | HEALARGO",
  description: "The requested page was not found. Explore HEALARGO natural oils, agro products, and everyday wellness essentials.",
};

export default function PublicNotFound() {
  return <NotFoundLandingView />;
}

