export const UI = {
  brand: "Healargo",
  brandTagline: "Natural Wellness",
  whatsappNumber: "917871694931",
  address: "Healargo, Your Store Address Here",
  email: "healargo@gmail.com",
  mapUrl: "",
  mapDirectionsUrl: "",
  mapEmbedUrl: "",
  workingHours: "Mon – Sun: 9:00 AM – 7:00 PM",
  announcement:
    "Free delivery on eligible orders — shop natural wellness with Healargo",
  since: "Healargo · Natural products for everyday wellness",
  trustFamilies: "1,000+",
  trustYears: "New",
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
    label: "Healargo Channel",
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
    label: "Healargo",
    href: UI.social.facebook,
    handle: "Healargo",
    description: "Follow our community for launches, updates & healthy living tips.",
    color: "#1877F2",
  },
] as const;

export const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Bestsellers", href: "/bestsellers" },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
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
