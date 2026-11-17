export const CONTACT_PHONES = [
  {
    digits: "7010389100",
    display: "+91 70103 89100",
    tel: "+917010389100",
  },
  {
    digits: "7871694931",
    display: "+91 78716 94931",
    tel: "+917871694931",
  },
  {
    digits: "9342165255",
    display: "+91 93421 65255",
    tel: "+919342165255",
  },
] as const;

export const UI = {
  brand: "HEALARGO",
  brandTagline: "Goodness, Naturally.",
  /** Primary WhatsApp number (with country code, no +). */
  whatsappNumber: "917871694931",
  phones: CONTACT_PHONES,
  address: "HEALARGO, Naturally Sourced Wellness",
  email: "healargo@gmail.com",
  mapUrl: "",
  mapDirectionsUrl: "",
  mapEmbedUrl: "",
  workingHours: "Mon – Sun: 9:00 AM – 7:00 PM",
  announcement: "Naturally good products. Delivered with care.",
  since: "HEALARGO · Goodness, Naturally.",
  trustFamilies: "1,000+",
  trustYears: "Pure",
  trustRating: "5.0",
  close: "Close",
  follow: "Follow",
  social: {
    instagram: "",
    facebook: "",
    youtube: "",
    whatsapp: "",
  },
} as const;

export const SOCIAL_LINKS = [
  {
    id: "whatsapp",
    name: "WhatsApp Channel",
    label: "HEALARGO Channel",
    href: UI.social.whatsapp,
    handle: "healargo",
    description:
      "Join our official WhatsApp Channel for product updates, offers & wellness tips.",
    color: "#25D366",
  },
  {
    id: "youtube",
    name: "YouTube",
    label: "@healargo",
    href: UI.social.youtube,
    handle: "@healargo",
    description: "Subscribe for product stories, sourcing journeys & wellness content.",
    color: "#FF0000",
  },
  {
    id: "instagram",
    name: "Instagram",
    label: "@healargo",
    href: UI.social.instagram,
    handle: "healargo",
    description: "Follow daily product highlights, customer stories & behind the scenes.",
    color: "#E1306C",
  },
  {
    id: "facebook",
    name: "Facebook",
    label: "HEALARGO",
    href: UI.social.facebook,
    handle: "healargo",
    description: "Follow our community for launches, updates & healthy living tips.",
    color: "#1877F2",
  },
] as const;

export const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Bestsellers", href: "/bestsellers" },
  { label: "Our Story", href: "/about" },
  { label: "Certificates", href: "/certificates" },
  { label: "Contact", href: "/contact" },
  { label: "FAQs", href: "/faqs" },
] as const;

export const FOOTER_POLICY_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Shipping Policy", href: "/shipping" },
  { label: "Return & Refund", href: "/refund" },
  { label: "Terms of Service", href: "/terms" },
] as const;
