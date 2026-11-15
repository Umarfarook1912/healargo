import { ASSETS } from "@/constants/assets";
import { UI } from "@/constants/ui";

/** Matches Healargo theme from globals.css (inline for email clients). */
export const EMAIL_THEME = {
  primary: "#1f5138",
  primaryForeground: "#ffffff",
  accent: "#c9a246",
  cream: "#eef4ef",
  creamDark: "#dde8e0",
  dark: "#10261b",
  muted: "#56645c",
  border: "#dbe3dd",
  card: "#ffffff",
  fontSans: "Georgia, 'Times New Roman', serif",
  fontBody: "Arial, Helvetica, sans-serif",
  logoUrl: ASSETS.LOGO_SOLID,
} as const;

export type EmailSocialLink = {
  label: string;
  href: string;
};

function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

function whatsappHref(): string {
  const n = UI.whatsappNumber.replace(/\D/g, "");
  return n ? `https://wa.me/${n}` : "";
}

/** Only links with a real href are shown in the email footer. */
export function getEmailSocialLinks(): EmailSocialLink[] {
  const links: EmailSocialLink[] = [
    { label: "WhatsApp Channel", href: UI.social.whatsapp },
    { label: "WhatsApp Chat", href: whatsappHref() },
    { label: "YouTube", href: UI.social.youtube },
    { label: "Instagram", href: UI.social.instagram },
    { label: "Facebook", href: UI.social.facebook },
  ];
  return links.filter((l) => Boolean(l.href));
}

export function getEmailSiteUrl(path = ""): string {
  return `${siteBase()}${path.startsWith("/") ? path : path ? `/${path}` : ""}`;
}

export const EMAIL_COPY = {
  orderConfirmSubject: `${UI.brand} — order confirmed`,
  orderAdminSubject: (orderId: string) =>
    `${UI.brand} — new paid order ${orderId}`,
  statusSubject: (status: string) =>
    `${UI.brand} — order ${status.toLowerCase()}`,
  contactSubject: (name: string) => `${UI.brand} — contact from ${name}`,
  resetSubject: `${UI.brand} — reset your password`,
  contactThanks: "Thanks — we received your message and will reply soon.",
  contactError: "Could not send your message. Please try WhatsApp or email us.",
  contactSubmit: "Send message",
  contactSending: "Sending…",
  contactName: "Your name",
  contactEmail: "Email",
  contactPhone: "Phone",
  contactMessage: "Message",
  footerTagline: UI.since,
  shopCta: "Visit our store",
  address: "Address",
  city: "City",
  state: "State",
  pincode: "Pincode",
  country: "Country",
} as const;

/** Inbox for admin alerts (contact form, new paid orders). */
export function getAdminNotifyEmail(): string {
  return process.env.ADMIN_NOTIFY_EMAIL?.trim() || UI.email;
}
