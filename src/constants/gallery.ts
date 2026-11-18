export type GalleryVideo = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  category: "videos";
  tag: string;
  badge: string;
  featured?: boolean;
  type?: "youtube" | "file";
  subCategory?: "extraction" | "packing" | "packaging" | "selling" | "whitelabel" | "story";
  youtubeId?: string;
  date?: string;
};

export type GalleryImage = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: "banners" | "products" | "combos" | "traditional";
  tag: string;
  badge?: string;
  aspectRatio?: "landscape" | "square" | "portrait";
  link?: string;
};

export type GalleryItem = GalleryVideo | GalleryImage;

export const GALLERY_CATEGORIES = [
  { id: "all", label: "All Media", count: 44 },
  { id: "packing", label: "📦 Packing & Dispatch", count: 4 },
  { id: "selling", label: "🛍️ Selling & Offers", count: 21 },
  { id: "whitelabel", label: "🏷️ White Label & Your Brand", count: 2 },
  { id: "extraction", label: "⚙️ Oil Extraction", count: 5 },
  { id: "videos", label: "🎥 Mill Videos (19)", count: 19 },
  { id: "banners", label: "✨ Banners & Promos", count: 4 },
  { id: "products", label: "🧴 Cold Pressed Oils", count: 9 },
  { id: "combos", label: "🎁 Combo Offers", count: 4 },
  { id: "traditional", label: "🏺 Heritage & Traditional", count: 11 },
] as const;

export const GALLERY_VIDEOS: GalleryVideo[] = [
  // 1. Live machine running & oil extraction
  {
    id: "cold-press-live-extraction",
    title: "Cold-Pressed Oil Live Extraction",
    description:
      "Live cold pressing of farm-fresh natural seeds using a gentle low-heat extraction method, preserving unrefined, naturally nutrient-rich golden oil.",
    videoUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/videos-vsoilmill/groundnuts.mp4?tr=orig-true",
    category: "videos",
    tag: "Oil Extraction Machine",
    badge: "Live Oil Extraction",
    featured: true,
    type: "file",
    subCategory: "extraction",
  },
  {
    id: "coconut-oil-live-flow",
    title: "Coconut Oil Extraction & Pure Fresh Flow",
    description:
      "Watch sulphur-free sun-dried copra being cold-pressed in our expeller, releasing crystal-pure, deeply fragrant coconut oil.",
    videoUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/videos-vsoilmill/coconut-oil.mp4?tr=orig-true",
    category: "videos",
    tag: "Coconut Oil Machine",
    badge: "Pure Coconut Flow",
    featured: true,
    type: "file",
    subCategory: "extraction",
  },
  {
    id: "dry-process-sesame-coconut",
    title: "Natural Sun-Drying Process: Sesame Seeds & Copra",
    description:
      "Traditional open-air sunlight drying of sesame seeds and premium coconut copra to eliminate moisture before cold pressing.",
    videoUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/videos-vsoilmill/dry-process-sesame-coconut-groundnut.mp4?tr=orig-true",
    category: "videos",
    tag: "Raw Material Sun-Drying",
    badge: "Natural Sun-Drying",
    featured: true,
    type: "file",
    subCategory: "extraction",
  },
  {
    id: "oil-machine-sesame-extraction",
    title: "Sesame Oil Machine Running & Live Cold Extraction",
    description:
      "Watch our traditional cold-press machine running at gentle speed, crushing dark sesame seeds to extract fresh, aromatic unrefined sesame oil.",
    videoUrl: "https://youtube.com/shorts/xJP29mjCkKc?si=iEq37ig2MWkyAJRe",
    category: "videos",
    tag: "Machine & Oil Extraction",
    badge: "Live Machine Running",
    featured: true,
    type: "youtube",
    subCategory: "extraction",
    youtubeId: "xJP29mjCkKc",
  },
  {
    id: "oil-machine-coconut-extraction",
    title: "Coconut Oil Machine Running & Live Extraction",
    description:
      "Watch sulphur-free naturally sun-dried copra being cold-pressed in our traditional cold-press mill to extract crystal-pure, fragrant coconut oil.",
    videoUrl: "https://youtube.com/shorts/_Wug05LRL4g?si=e_479Hi1QJJ_5v-u",
    category: "videos",
    tag: "Machine & Oil Extraction",
    badge: "Live Machine Running",
    featured: true,
    type: "youtube",
    subCategory: "extraction",
    youtubeId: "_Wug05LRL4g",
  },

  // 2. Customer Orders Packaging & Doorstep Courier Dispatch (PACKING)
  {
    id: "customer-packaging-dispatch-general",
    title: "Safe Packaging & Doorstep Delivery Dispatch to Customers",
    description:
      "See how we safely pack pure cold-pressed oils and Uthukuli cow ghee with bubble cushioning, tamper-proof seals, and corrugated boxes for nationwide doorstep delivery.",
    videoUrl: "https://www.youtube.com/shorts/Yz_iUykJBzc",
    category: "videos",
    tag: "Packaging & Dispatch",
    badge: "Safe Delivery",
    featured: true,
    type: "youtube",
    subCategory: "packing",
    youtubeId: "Yz_iUykJBzc",
  },
  {
    id: "customer-packaging-26-oct-2026",
    title: "Customer Orders Packaging & Dispatch — 26 October 2026",
    description:
      "Real customer shipment dispatch log from 26 October 2026: packing bottles, 5L cans, and combo packs for prompt courier dispatch across Tamil Nadu & India.",
    videoUrl: "https://www.youtube.com/shorts/38e8jJcyH0I",
    category: "videos",
    tag: "Packaging & Dispatch",
    badge: "26 Oct 2026 Dispatch",
    featured: false,
    type: "youtube",
    subCategory: "packing",
    date: "26 October 2026",
    youtubeId: "38e8jJcyH0I",
  },
  {
    id: "customer-packaging-17-oct-2026",
    title: "Customer Orders Packaging & Dispatch — 17 October 2026",
    description:
      "Real customer shipment dispatch log from 17 October 2026: safe packing of traditional cold-pressed oils and pure cow ghee sent to delighted customers.",
    videoUrl: "https://www.youtube.com/shorts/tKsSgb3zhuQ",
    category: "videos",
    tag: "Packaging & Dispatch",
    badge: "17 Oct 2026 Dispatch",
    featured: false,
    type: "youtube",
    subCategory: "packing",
    date: "17 October 2026",
    youtubeId: "tKsSgb3zhuQ",
  },
  {
    id: "customer-packaging-cow-ghee-30l",
    title: "Customer Orders Packaging & Dispatch — 30 Litres Cow Ghee Courier Dispatch",
    description:
      "Watch our team carefully pack and dispatch 30 litres of pure Uthukuli cow ghee in protective courier packaging with doorstep delivery all over Tamil Nadu.",
    videoUrl: "https://www.youtube.com/shorts/S4F6A1PH-9E",
    category: "videos",
    tag: "Packaging & Dispatch",
    badge: "30L Ghee Dispatch",
    featured: true,
    type: "youtube",
    subCategory: "packing",
    youtubeId: "S4F6A1PH-9E",
  },

  // 3. Direct Mill Selling, Factory Rates & Exclusive Offers (SELLING)
  {
    id: "selling-sesame-oil-350",
    title: "Cold Pressed Sesame Oil Direct Sale — ₹350/L with Door Delivery",
    description:
      "Direct selling highlight: fresh cold-pressed sesame oil at ₹350 per litre with door delivery available.",
    videoUrl: "https://youtube.com/shorts/xJP29mjCkKc?si=iEq37ig2MWkyAJRe",
    category: "videos",
    tag: "Direct Selling",
    badge: "₹350/L Direct Sale",
    featured: true,
    type: "youtube",
    subCategory: "selling",
    youtubeId: "xJP29mjCkKc",
  },
  {
    id: "selling-coconut-oil-350",
    title: "Cold Pressed Coconut Oil Direct Sale — ₹350/L with Door Delivery",
    description:
      "Direct selling highlight: 100% sulphur-free copra coconut oil at ₹350 per litre with prompt courier delivery.",
    videoUrl: "https://youtube.com/shorts/_Wug05LRL4g?si=e_479Hi1QJJ_5v-u",
    category: "videos",
    tag: "Direct Selling",
    badge: "₹350/L Direct Sale",
    featured: true,
    type: "youtube",
    subCategory: "selling",
    youtubeId: "_Wug05LRL4g",
  },
  {
    id: "selling-diwali-combo-offer",
    title: "Diwali Special Combo Offer & Booking — ₹2,222 Sale Price (MRP ₹3,000)",
    description:
      "Festive celebration combo booking: cold pressed groundnut, sesame & coconut oils plus pure Uthukuli cow ghee at ₹2,222 exclusive sale price.",
    videoUrl: "https://www.youtube.com/shorts/Kjz0OuGsh-s",
    category: "videos",
    tag: "Combo Sale Offer",
    badge: "₹2,222 Sale Booking",
    featured: true,
    type: "youtube",
    subCategory: "selling",
    youtubeId: "Kjz0OuGsh-s",
  },
  {
    id: "selling-weekend-cow-ghee-700",
    title: "Weekend Pure Cow Ghee Sale Offer — ₹700/L with Free Door Delivery",
    description:
      "Special weekend direct sale: pure golden grainy Uthukuli Desi Cow Ghee at ₹700 per litre with free doorstep courier delivery across Tamil Nadu.",
    videoUrl: "https://www.youtube.com/shorts/92frcHQQS_g",
    category: "videos",
    tag: "Weekend Sale Offer",
    badge: "₹700/L Ghee Sale",
    featured: true,
    type: "youtube",
    subCategory: "selling",
    youtubeId: "92frcHQQS_g",
  },

  // 4. White Label, Unlabeled Supply & Custom Branding (WHITE LABEL)
  {
    id: "white-label-unlabeled-supply-video",
    title: "White Label & Private Brand Supply — Unlabeled Oils for Your Own Brand",
    description:
      "HEALARGO supplies pure cold-pressed oils in unlabeled bottles and cans. Resellers and brand owners can add their own labels and sell under their own brand with zero factory setup cost.",
    videoUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/whitelabel/whitelabel.mp4?tr=orig-true",
    category: "videos",
    tag: "White Label Supply",
    badge: "Sell With Your Brand",
    featured: true,
    type: "file",
    subCategory: "whitelabel",
  },
  {
    id: "white-label-branding-nonbranding-short",
    title: "Branded & Non-Branded (Unlabeled) Oil Supply & Direct Reseller Service",
    description:
      "Watch how we supply non-branded (unlabeled) oil cans and bottles for resellers who apply their own brand labels, as well as direct doorstep indirect services.",
    videoUrl: "https://www.youtube.com/shorts/rQvuRBB4EMk",
    category: "videos",
    tag: "Custom Branding",
    badge: "Non-Branded Supply",
    featured: true,
    type: "youtube",
    subCategory: "whitelabel",
    youtubeId: "rQvuRBB4EMk",
  },

  // 5. Mill Stories, Sourcing & Founder Explanations
  {
    id: "president-dignitary-mill-visit",
    title: "Dignitary Inspection Visit",
    description:
      "A dignitary and association president visit, observing traditional cold-pressed operations and quality standards.",
    videoUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/videos-vsoilmill/presdient-visit.mp4?tr=orig-true",
    category: "videos",
    tag: "President & Dignitary Visit",
    badge: "President Mill Visit",
    featured: true,
    type: "file",
    subCategory: "story",
  },
  {
    id: "special-and-taste",
    title: "What Makes HEALARGO Special & The Pure Taste of Cold-Pressed Oil",
    description:
      "Watch how traditional low-heat cold pressing helps preserve natural aroma, character, and taste without harsh refining.",
    videoUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/special/1.mp4?tr=orig-true",
    category: "videos",
    tag: "Special & Taste",
    badge: "Founder Explains",
    featured: true,
    type: "file",
    subCategory: "story",
  },
  {
    id: "low-price-part-1",
    title: "How HEALARGO Offers Fair Pricing with High Quality — Part 1: Direct Sourcing",
    description:
      "See how direct bulk sourcing helps reduce middleman commissions and keeps quality products affordable for everyday families.",
    videoUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/how/1.mp4?tr=orig-true",
    category: "videos",
    tag: "Mill Pricing Part 1",
    badge: "Direct Farm Sourcing",
    featured: true,
    type: "file",
    subCategory: "story",
  },
  {
    id: "low-price-part-2",
    title: "How HEALARGO Offers Fair Pricing with High Quality — Part 2: In-House Efficiency",
    description:
      "Explore our in-house extraction and natural settling process that supports reliable quality without expensive markups.",
    videoUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/how/2.mp4?tr=orig-true",
    category: "videos",
    tag: "Mill Pricing Part 2",
    badge: "In-House Mill Efficiency",
    featured: true,
    type: "file",
    subCategory: "story",
  },
  {
    id: "why-choose-healargo",
    title: "Why You Should Choose HEALARGO for Your Family",
    description:
      "Discover why conscious households trust HEALARGO for cold-pressed oils, tested quality, and doorstep delivery.",
    videoUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/whyvsoil/1.mp4?tr=orig-true",
    category: "videos",
    tag: "Why Choose Us",
    badge: "Why Choose Us",
    featured: true,
    type: "file",
    subCategory: "story",
  },
];

export const GALLERY_IMAGES: GalleryImage[] = [
  // Banners & Promos
  {
    id: "banner-oils",
    title: "Pure, Traditional Cold-Pressed Oils Banner",
    description:
      "Cold-pressed at low temperatures to retain natural nutrients, aroma, and rich authentic taste.",
    imageUrl: "https://ik.imagekit.io/mnm0iz0ng2/banner/1.png",
    category: "banners",
    tag: "Mill Banner",
    badge: "Signature Collection",
    aspectRatio: "landscape",
    link: "/shop",
  },
  {
    id: "banner-ghee",
    title: "Authentic Uthukuli Desi Cow Ghee Banner",
    description:
      "Slow-cooked traditionally with golden granules and heavenly aroma from grass-fed cows.",
    imageUrl: "https://ik.imagekit.io/mnm0iz0ng2/banner/2.png",
    category: "banners",
    tag: "Pure Cow Ghee",
    badge: "Bilona Churned",
    aspectRatio: "landscape",
    link: "/categories/pure-cow-ghee",
  },
  {
    id: "banner-honey",
    title: "Pure Raw Wild Forest Honey Promo",
    description:
      "100% unheated, unprocessed raw honey straight from natural apiaries.",
    imageUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/honey.jpeg?updatedAt=1792839297577",
    category: "banners",
    tag: "Natural Honey",
    badge: "100% Pure Raw",
    aspectRatio: "square",
    link: "/products/honey-with-dry-nuts-mixture",
  },
  {
    id: "banner-combo-deals",
    title: "Special Value Combo Offer Banner",
    description:
      "Save up to 25% on our specially curated oil and ghee value combo bundles.",
    imageUrl: "https://ik.imagekit.io/mnm0iz0ng2/category/combo.jpg",
    category: "banners",
    tag: "Combo Savings",
    badge: "Special Deals",
    aspectRatio: "square",
    link: "/combos",
  },

  // Cold Pressed Oils & Signature Products (All active in store)
  {
    id: "prod-castor-5l",
    title: "ஆமணக்கு எண்ணெய் (Castor Oil) — 5 Litre Can",
    description:
      "Pure cold-pressed castor oil in 5 Litre Can for traditional health and wellness.",
    imageUrl:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Castor%20Oil%205%20Litre%20Can/Castor-Oil-5-Litre-Can-1536x1229.jpg?updatedAt=1789281326444",
    category: "products",
    tag: "Castor Oil",
    badge: "Pure & Natural",
    aspectRatio: "landscape",
    link: "/products/castor-oil",
  },
  {
    id: "prod-sesame-1l",
    title: "நல்லெண்ணெய் (Sesame Oil) — 1 Liter Bottle",
    description:
      "Pure cold-pressed sesame oil with natural palm jaggery, unrefined and deeply aromatic.",
    imageUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/update-sesameOil/1liter.jpeg",
    category: "products",
    tag: "Sesame Oil",
    badge: "Popular Choice",
    aspectRatio: "square",
    link: "/products/sesame-oil",
  },
  {
    id: "prod-coconut-5l",
    title: "தேங்காய் எண்ணெய் (Coconut Oil) — 5 Litre Can",
    description:
      "Sulphur-free copra cold-pressed at low temperature for cooking, hair, and baby care.",
    imageUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/coco_oil/5liter.jpeg?updatedAt=1792836907838",
    category: "products",
    tag: "Coconut Oil",
    badge: "Cold Pressed",
    aspectRatio: "landscape",
    link: "/products/coconut-oil",
  },
  {
    id: "prod-sesame-5l",
    title: "நல்லெண்ணெய் (Sesame Oil) — 5 Litre Can",
    description:
      "Traditional 5 Litre family value pack pressed from premium dark sesame seeds.",
    imageUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/update-sesameOil/5liter.jpeg?updatedAt=1792836907423",
    category: "products",
    tag: "Sesame Oil",
    badge: "Family Pack",
    aspectRatio: "landscape",
    link: "/products/sesame-oil",
  },
  {
    id: "prod-coconut-1l",
    title: "தேங்காய் எண்ணெய் (Coconut Oil) — 1 Liter Bottle",
    description:
      "Pure unrefined coconut oil in a convenient 1 Liter bottle.",
    imageUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/coco_oil/1liter.jpeg?updatedAt=1792836907748",
    category: "products",
    tag: "Coconut Oil",
    badge: "Daily Essential",
    aspectRatio: "square",
    link: "/products/coconut-oil",
  },
  {
    id: "prod-castor-1l",
    title: "ஆமணக்கு எண்ணெய் (Castor Oil) — 1 Liter Bottle",
    description:
      "Pure cold-pressed castor oil in a convenient 1 Liter bottle.",
    imageUrl:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Castor%20Oil%201%20Litre/VS-Gold-Castor-Oil-1-Litre.jpg?updatedAt=1789281326730",
    category: "products",
    tag: "Castor Oil",
    badge: "Daily Essential",
    aspectRatio: "square",
    link: "/products/castor-oil",
  },
  {
    id: "prod-castor-15kg",
    title: "ஆமணக்கு எண்ணெய் (Castor Oil) — 15 Kg Tin",
    description:
      "Pure cold-pressed castor oil in 15 Kg commercial tin.",
    imageUrl:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Castor%20Oil%2015%20Kg%20Tin/Castor-Oil-15-Kg-Tin.jpg?updatedAt=1789281326960",
    category: "products",
    tag: "Castor Oil",
    badge: "15 Kg Bulk",
    aspectRatio: "portrait",
    link: "/products/castor-oil",
  },
  {
    id: "prod-sesame-15kg",
    title: "நல்லெண்ணெய் (Sesame Oil) — 15 Kg Tin",
    description:
      "Pure cold pressed sesame oil in traditional 15 Kg bulk tin for restaurants and events.",
    imageUrl:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/Vs%20Wooden%20Pressed%20Sesame%20Oil%2015%20Kg%20Tin/Wooden-Pressed-Sesame-Oil-15-Kg-Tin.jpg?updatedAt=1789281326742",
    category: "products",
    tag: "Sesame Oil",
    badge: "15 Kg Bulk",
    aspectRatio: "portrait",
    link: "/products/sesame-oil",
  },
  {
    id: "prod-coconut-15kg",
    title: "தேங்காய் எண்ணெய் (Coconut Oil) — 15 Kg Tin",
    description:
      "Bulk cold-pressed coconut oil in 15 Kg commercial tin.",
    imageUrl:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/Vs%20Wooden%20Pressed%20Coconut%20Oil%2015%20Kg%20Tin/Wooden-Pressed-Coconut-Oil-15-Kg-Tin.jpg?updatedAt=1789281326992",
    category: "products",
    tag: "Coconut Oil",
    badge: "15 Kg Bulk",
    aspectRatio: "portrait",
    link: "/products/coconut-oil",
  },

  // Combos & Value Offers (All active in store)
  {
    id: "combo-kitchen",
    title: "Kitchen Combo",
    description:
      "Essential cold pressed oil bundle for everyday healthy home cooking.",
    imageUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/Kitchen%20combo/kitchen-combo%202.jpeg?updatedAt=1792839926536",
    category: "combos",
    tag: "Kitchen Value",
    badge: "Top Combo",
    aspectRatio: "portrait",
    link: "/combos/kitchen-combo",
  },
  {
    id: "combo-gold-coin",
    title: "Gold 🪙 Coin Offer — Sesame Oil 3 Litres",
    description:
      "Special festive offer: 3 Litres of pure sesame oil with a gold coin guarantee.",
    imageUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/goldcoin/1.jpeg",
    category: "combos",
    tag: "Festive Offer",
    badge: "Gold Coin Deal",
    aspectRatio: "portrait",
    link: "/combos/gold-coin-offer-sesame-oil-3-litres",
  },
  {
    id: "combo-diwali",
    title: "Diwali Special Combo Package",
    description:
      "Celebration combo pack containing pure cold-pressed oils and aromatic Uthukuli cow ghee.",
    imageUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/diwali/1.jpeg",
    category: "combos",
    tag: "Festive Combo",
    badge: "Festival Deal",
    aspectRatio: "portrait",
    link: "/combos/diwali-combo-package",
  },
  {
    id: "combo-oil-mega",
    title: "Oil Mega Combo Package",
    description:
      "The ultimate all-in-one family savings package with pure cold-pressed sesame, coconut, and castor oils.",
    imageUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/megacombo/1.jpeg",
    category: "combos",
    tag: "Mega Savings",
    badge: "Max Savings",
    aspectRatio: "portrait",
    link: "/combos/oil-mega-combo-package",
  },

  // Heritage, Traditional & Pure Ghee (All active in store)
  {
    id: "trad-ghee-1l",
    title: "பசு நெய் (Pure Cow Ghee) — 1 Litre Jar",
    description:
      "Rich, aromatic, grainy textured authentic Uthukuli desi cow ghee packed in airtight jars.",
    imageUrl:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Uthukuli%20Ghee%201%20Litre/20250925_222958_0000%20(1).png?updatedAt=1789281326869",
    category: "traditional",
    tag: "Pure Cow Ghee",
    badge: "Bilona Method",
    aspectRatio: "square",
    link: "/products/pure-cow-ghee",
  },
  {
    id: "trad-ghee-500ml",
    title: "பசு நெய் (Pure Cow Ghee) — 500 ML Jar",
    description:
      "Traditional village bilona churned Uthukuli cow ghee with natural golden grains.",
    imageUrl:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Uthukuli%20Ghee%20500%20ML/20250925_222958_0000.png?updatedAt=1789281326852",
    category: "traditional",
    tag: "Pure Cow Ghee",
    badge: "Pure & Golden",
    aspectRatio: "square",
    link: "/products/pure-cow-ghee",
  },
  {
    id: "trad-ghee-5l",
    title: "பசு நெய் (Pure Cow Ghee) — 5 Litre Family Can",
    description:
      "Authentic bilona-churned Uthukuli cow ghee in convenient 5 Litre family pack.",
    imageUrl:
      "https://ik.imagekit.io/r33t79noj/vsoilmill/vsupdated/ghee/5liter.jpeg",
    category: "traditional",
    tag: "Pure Cow Ghee",
    badge: "Family Can",
    aspectRatio: "portrait",
    link: "/products/pure-cow-ghee",
  },
  {
    id: "trad-castor-1l",
    title: "ஆமணக்கு எண்ணெய் (Castor Oil) — 1 Litre",
    description:
      "Pure cold-pressed castor oil for Ayurvedic hair treatment, skin conditioning, and cooling.",
    imageUrl:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Castor%20Oil%201%20Litre/VS-Gold-Castor-Oil-1-Litre.jpg?updatedAt=1789281326730",
    category: "traditional",
    tag: "Castor Oil",
    badge: "Ayurvedic Purity",
    aspectRatio: "portrait",
    link: "/products/castor-oil",
  },
  {
    id: "trad-cold-expeller",
    title: "Traditional Cold-Press Churner",
    description:
      "Our authentic cold-press churner in Madurai pressing oils at slow, gentle speeds.",
    imageUrl: "https://ik.imagekit.io/mnm0iz0ng2/category/Wooden-Pressed.jpg",
    category: "traditional",
    tag: "Mill Heritage",
    badge: "Traditional Cold-Press",
    aspectRatio: "landscape",
    link: "/about",
  },
  {
    id: "trad-pure-ghee-process",
    title: "Heritage Uthukuli Cow Ghee Bilona Method",
    description:
      "Traditional village churning method to create pure, wholesome bilona cow ghee.",
    imageUrl: "https://ik.imagekit.io/mnm0iz0ng2/category/pure_ghee.png",
    category: "traditional",
    tag: "Bilona Ghee",
    badge: "Traditional Method",
    aspectRatio: "landscape",
    link: "/categories/pure-cow-ghee",
  },
];
