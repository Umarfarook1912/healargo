export const SITE_NAME = "Healargo";
export const SITE_TAGLINE = "Natural Wellness, Thoughtfully Sourced";
export const SITE_DESCRIPTION =
  "Healargo brings carefully sourced natural products for everyday wellness — pure, honest, and delivered with care.";

export const SEO_DEFAULTS = {
  titleTemplate: `%s | ${SITE_NAME}`,
  defaultTitle: `${SITE_NAME} – ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  locale: "en_IN",
  type: "website" as const,
  twitterCard: "summary_large_image" as const,
};

export const FREE_SHIPPING_THRESHOLD = 999;
export const GST_RATE = 0.05;
export const CURRENCY = "INR";
export const CURRENCY_SYMBOL = "₹";
