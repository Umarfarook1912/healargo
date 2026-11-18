export type FaqVideo = {
  title: string;
  url: string;
  label?: string;
  part?: string;
  description?: string;
};

export type FaqItem = {
  id: string;
  q: string;
  a: string;
  category: "videos" | "general" | "products" | "delivery";
  badge?: string;
  videos?: FaqVideo[];
};

export const FAQ_CATEGORIES = [
  { id: "all", label: "All Questions" },
  { id: "videos", label: "🎥 Video Answers", count: 3 },
  { id: "products", label: "Oil & Ghee Quality", count: 4 },
  { id: "delivery", label: "Shipping & Orders", count: 1 },
  { id: "general", label: "Payments & General", count: 1 },
] as const;

export const FAQS: FaqItem[] = [
  {
    id: "special-and-taste",
    q: "What makes HEALARGO oils special?",
    a: "HEALARGO focuses on traditional low-heat, cold-pressed extraction that helps preserve natural aroma, character, and everyday cooking quality. We avoid harsh chemical refining steps so the oils stay pure and true to their natural origins.",
    category: "videos",
    badge: "Featured Brand Video",
    videos: [
      {
        title: "What makes HEALARGO special and why the taste stands out",
        url: "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/special/1.mp4?tr=orig-true",
        label: "Watch Video Explanation",
        description: "A closer look at our traditional low-heat process, clean handling, and naturally rich flavor.",
      },
    ],
  },
  {
    id: "low-price-and-quality",
    q: "How does HEALARGO keep quality high while pricing stays fair?",
    a: "We keep things straightforward: thoughtful farm-direct sourcing, careful production, and direct online delivery. That helps us focus resources on product purity and customer value.",
    category: "videos",
    badge: "2-Part Video Guide",
    videos: [
      {
        title: "Part 1: Farm-Direct Sourcing & Honest Mill Pricing",
        url: "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/how/1.mp4?tr=orig-true",
        part: "Part 1",
        label: "Watch Part 1",
        description: "How direct farmer relationships eliminate middleman markups and keep prices fair for customers.",
      },
      {
        title: "Part 2: Production efficiency and quality assurance",
        url: "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/how/2.mp4?tr=orig-true",
        part: "Part 2",
        label: "Watch Part 2",
        description: "How careful handling and efficient operations support consistent quality.",
      },
    ],
  },
  {
    id: "why-choose-healargo",
    q: "Why choose HEALARGO for everyday cooking and natural wellness?",
    a: "HEALARGO combines honest ingredients, careful extraction, verified quality standards, and convenient pan-India delivery. We aim to bring trusted natural products into modern homes.",
    category: "videos",
    badge: "Why Choose Us",
    videos: [
      {
        title: "Why choose HEALARGO — quality, trust, and everyday goodness",
        url: "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/whyvsoil/1.mp4?tr=orig-true",
        label: "Watch Video Tour",
        description: "See how HEALARGO approaches product quality, trust, and customer care.",
      },
    ],
  },
  {
    id: "what-is-cold-pressed-oil",
    q: "What is cold-pressed oil?",
    a: "Cold-pressed oil is extracted at low heat using traditional mechanical extraction methods instead of chemical solvents and high-heat refining. This preserves natural nutrients, authentic aroma, and wholesome cooking quality.",
    category: "products",
  },
  {
    id: "delivery-across-india",
    q: "Do you deliver across India?",
    a: "Yes. We ship pan-India. All orders qualify for free express shipping — there is no cost for delivery. Estimated delivery typically takes 3 to 5 business days.",
    category: "delivery",
  },
  {
    id: "payment-methods",
    q: "What payment methods do you accept?",
    a: "We accept UPI, cards, and net banking. You can also place an order enquiry via WhatsApp.",
    category: "general",
  },
  {
    id: "ghee-bilona-process",
    q: "How is your Pure Cow Ghee prepared?",
    a: "Our pure cow ghee is prepared using traditional bilona methods from grass-fed desi cows for authentic grainy texture, golden color, and divine aroma.",
    category: "products",
  },
  {
    id: "store-oils",
    q: "How should I store the oils?",
    a: "Store in a cool, dry place away from direct sunlight. Use a clean, dry spoon and keep the bottle tightly closed.",
    category: "products",
  },
  {
    id: "bulk-15kg-tins",
    q: "Can I order bulk 15 Kg tins?",
    a: "Yes. 15 Kg tins are available for sesame oil, coconut oil, castor oil, and pure cow ghee. Contact us for restaurant and wholesale needs.",
    category: "products",
  },
];
