export const SITE_NAME = "HEALARGO";
export const SITE_TAGLINE = "Goodness, Naturally.";
export const SITE_DESCRIPTION =
  "Thoughtfully sourced natural products that bring a little more goodness into your everyday life. Pure edible oils and naturally crafted agro essentials.";

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
