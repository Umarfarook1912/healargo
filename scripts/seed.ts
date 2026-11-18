import "dotenv/config";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { connectDb, prisma } from "../src/lib/db/prisma";
import { slugify } from "../src/lib/utils/format";
import { AUTH, USER_ROLES } from "../src/constants/auth";
import { checkSeedAllowed } from "./seed-guard";

const categories = [
  {
    name: "Cold Pressed Oils",
    slug: "cold-pressed-oils",
    description: "Pure • Traditional • Cold-Pressed",
    image: "https://ik.imagekit.io/mnm0iz0ng2/category/Wooden-Pressed.jpg",
    badge: "Best Seller",
    sortOrder: 1,
  },
  {
    name: "Pure Cow Ghee",
    slug: "pure-cow-ghee",
    description: "Traditional Taste & Quality",
    image: "https://ik.imagekit.io/mnm0iz0ng2/category/pure_ghee.png",
    badge: "A2 Bilona",
    sortOrder: 2,
  },
  {
    name: "Traditional Oils",
    slug: "traditional-oils",
    description: "Castor • Pongam • Neem",
    image: "https://ik.imagekit.io/mnm0iz0ng2/category/traditional.jpg",
    badge: "Sacred & Pure",
    sortOrder: 3,
  },
];

type SeedProduct = {
  name: string;
  shortDescription: string;
  description: string;
  categorySlug: string;
  image: string;
  images?: string[];
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  tags?: string[];
  variants: {
    label: string;
    sku: string;
    originalPrice: number;
    price: number;
    stock: number;
    image?: string;
  }[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
  };
};

const products: SeedProduct[] = [
  // 1. COLD PRESSED SESAME OIL
  {
    name: "Cold Pressed Sesame Oil",
    shortDescription: "Pure Cold Pressed Sesame (Gingelly) Oil | Gst 5%",
    description:
      "<p>100% natural Cold Pressed Sesame Oil (Gingelly Oil), extracted at low temperatures using traditional methods to retain natural nutrients, antioxidants, and rich nutty flavor.</p>",
    categorySlug: "cold-pressed-oils",
    image:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Wooden%20Pressed%20Sesame%20Oil%201%20Liter/VS-Wooden-Pressed-Sesame-Oil.jpg?updatedAt=1789281326285",
    isBestSeller: true,
    tags: [
      "cold pressed oil",
      "cold pressed sesame oil",
      "sesame oil",
      "gingelly oil",
      "til oil",
      "nallenai",
    ],
    variants: [
      {
        label: "500 ML",
        sku: "SES-500ML",
        originalPrice: 210,
        price: 180,
        stock: 120,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Wooden%20Pressed%20Sesame%20Oil%201%20Liter/VS-Wooden-Pressed-Sesame-Oil.jpg?updatedAt=1789281326285",
      },
      {
        label: "1 Liter Bottle",
        sku: "SES-1L",
        originalPrice: 400,
        price: 350,
        stock: 150,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Wooden%20Pressed%20Sesame%20Oil%201%20Liter/VS-Wooden-Pressed-Sesame-Oil.jpg?updatedAt=1789281326285",
      },
      {
        label: "5 Litre Can",
        sku: "SES-5L",
        originalPrice: 2000,
        price: 1750,
        stock: 80,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Wooden%20Pressed%20Sesame%20-%20Oil%205%20Litre%20Can/Wooden-Pressed-Sesame-Oil-5-Litre-Can-1-1536x1229.jpg?updatedAt=1789281326438",
      },
      {
        label: "16 Liter Tin",
        sku: "SES-16L-TIN",
        originalPrice: 6600,
        price: 5775,
        stock: 30,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/Vs%20Wooden%20Pressed%20Sesame%20Oil%2015%20Kg%20Tin/Wooden-Pressed-Sesame-Oil-15-Kg-Tin.jpg?updatedAt=1789281326742",
      },
    ],
  },

  // 2. COLD PRESSED COCONUT OIL
  {
    name: "Cold Pressed Coconut Oil",
    shortDescription: "Pure Cold Pressed Coconut Oil | Gst 5%",
    description:
      "<p>100% pure Cold Pressed Coconut Oil extracted from premium sun-dried copra at low temperatures. Ideal for traditional cooking, dietary wellness, skin moisturization, and hair care.</p>",
    categorySlug: "cold-pressed-oils",
    image:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Wooden%20Pressed%20Coconut%20Oil%201%20Liter/VS-Wooden-Pressed-Coconut-Oil.jpg?updatedAt=1789281326421",
    isBestSeller: true,
    tags: [
      "cold pressed oil",
      "cold pressed coconut oil",
      "coconut oil",
      "thengai ennai",
      "unrefined coconut oil",
    ],
    variants: [
      {
        label: "500 ML",
        sku: "COC-500ML",
        originalPrice: 200,
        price: 180,
        stock: 120,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Wooden%20Pressed%20Coconut%20Oil%201%20Liter/VS-Wooden-Pressed-Coconut-Oil.jpg?updatedAt=1789281326421",
      },
      {
        label: "1 Liter Bottle",
        sku: "COC-1L",
        originalPrice: 380,
        price: 350,
        stock: 120,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Wooden%20Pressed%20Coconut%20Oil%201%20Liter/VS-Wooden-Pressed-Coconut-Oil.jpg?updatedAt=1789281326421",
      },
      {
        label: "5 Litre Can",
        sku: "COC-5L",
        originalPrice: 2000,
        price: 1750,
        stock: 75,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Wooden%20Pressed%20Coconut%20-%20Oil%205%20Litre%20Can/Wooden-Pressed-Cocunut-Oil-5-Litre-Can-1536x1229.jpg?updatedAt=1789281326275",
      },
      {
        label: "16 Liter Tin",
        sku: "COC-16L-TIN",
        originalPrice: 6000,
        price: 5500,
        stock: 40,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/Vs%20Wooden%20Pressed%20Coconut%20Oil%2015%20Kg%20Tin/Wooden-Pressed-Coconut-Oil-15-Kg-Tin.jpg?updatedAt=1789281326992",
      },
    ],
  },

  // 3. COLD PRESSED GROUNDNUT OIL
  {
    name: "Cold Pressed Groundnut Oil",
    shortDescription: "Pure Cold Pressed Groundnut (Peanut) Oil | Gst 5%",
    description:
      "<p>Unrefined Cold Pressed Groundnut Oil pressed from premium farm-fresh peanuts. Retains natural phytosterols and vitamin E for wholesome, heart-friendly cooking.</p>",
    categorySlug: "cold-pressed-oils",
    image:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Wooden%20Pressed%20Groundnut%20Oil%201%20Liter/VS-Wooden-Pressed-Groundnut-Oil.jpg?updatedAt=1789281326509",
    isBestSeller: true,
    tags: [
      "cold pressed oil",
      "cold pressed groundnut oil",
      "groundnut oil",
      "peanut oil",
      "kadalai ennai",
    ],
    variants: [
      {
        label: "500 ML",
        sku: "GN-500ML",
        originalPrice: 160,
        price: 140,
        stock: 100,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Wooden%20Pressed%20Groundnut%20Oil%201%20Liter/VS-Wooden-Pressed-Groundnut-Oil.jpg?updatedAt=1789281326509",
      },
      {
        label: "1 Liter Bottle",
        sku: "GN-1L",
        originalPrice: 300,
        price: 260,
        stock: 140,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Wooden%20Pressed%20Groundnut%20Oil%201%20Liter/VS-Wooden-Pressed-Groundnut-Oil.jpg?updatedAt=1789281326509",
      },
      {
        label: "5 Litre Can",
        sku: "GN-5L",
        originalPrice: 1500,
        price: 1300,
        stock: 90,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Wooden%20Pressed%20Groundnut%20-%20Oil%205%20Litre%20Can/Wooden-Presseed-Groundnut-Oil-5-Litre-Can-1536x1229.jpg?updatedAt=1789281326129",
      },
      {
        label: "16 Liter Tin",
        sku: "GN-16L-TIN",
        originalPrice: 4800,
        price: 4200,
        stock: 45,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/Vs%20Wooden%20Pressed%20Groundnut%20Oil%2015%20Kg%20Tin/Wooden-Pressed-Groundnut-Oil-15-Kg-Tin.jpg?updatedAt=1789281326935",
      },
    ],
  },

  // 4. CASTOR OIL (no "Cold Pressed" in name)
  {
    name: "Castor Oil",
    shortDescription: "Pure Traditional Castor Oil | Gst 5%",
    description:
      "<p>Pure Castor Oil (Amanakku Ennai) crafted for traditional wellness, soothing heat relief, hair strength, and Ayurvedic routines.</p>",
    categorySlug: "traditional-oils",
    image:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Castor%20Oil%201%20Litre/VS-Gold-Castor-Oil-1-Litre.jpg?updatedAt=1789281326730",
    tags: [
      "castor oil",
      "amanakku ennai",
      "hair care",
      "body cooling",
      "traditional oil",
    ],
    variants: [
      {
        label: "500 ML",
        sku: "CAS-500ML",
        originalPrice: 160,
        price: 130,
        stock: 100,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Castor%20Oil%201%20Litre/VS-Gold-Castor-Oil-1-Litre.jpg?updatedAt=1789281326730",
      },
      {
        label: "1 Liter Bottle",
        sku: "CAS-1L",
        originalPrice: 300,
        price: 250,
        stock: 100,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Castor%20Oil%201%20Litre/VS-Gold-Castor-Oil-1-Litre.jpg?updatedAt=1789281326730",
      },
      {
        label: "5 Litre Can",
        sku: "CAS-5L",
        originalPrice: 1500,
        price: 1250,
        stock: 60,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Castor%20Oil%205%20Litre%20Can/Castor-Oil-5-Litre-Can-1536x1229.jpg?updatedAt=1789281326444",
      },
      {
        label: "16 Liter Tin",
        sku: "CAS-16L-TIN",
        originalPrice: 4950,
        price: 3000,
        stock: 50,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Castor%20Oil%2015%20Kg%20Tin/Castor-Oil-15-Kg-Tin.jpg?updatedAt=1789281326960",
      },
    ],
  },

  // 5. PONGAM OIL (no "Cold Pressed" in name)
  {
    name: "Pongam Oil",
    shortDescription: "Pure Pongam (Pungam) Oil | Gst 5%",
    description:
      "<p>Pure Pongam Oil (Karanja / Pungam Ennai) used traditionally for lighting sacred deepams, natural skin nourishment, and agricultural bio-care.</p>",
    categorySlug: "traditional-oils",
    image:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Ponga%20Oil%201%20Litre/VS-Gold-Ponga-Oil-1-Litre.jpg?updatedAt=1789281326731",
    tags: [
      "pongam oil",
      "pungam ennai",
      "ponga oil",
      "karanja oil",
      "deepam oil",
      "traditional oil",
    ],
    variants: [
      {
        label: "500 ML",
        sku: "PONG-500ML",
        originalPrice: 130,
        price: 110,
        stock: 80,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Ponga%20Oil%201%20Litre/VS-Gold-Ponga-Oil-1-Litre.jpg?updatedAt=1789281326731",
      },
      {
        label: "1 Liter Bottle",
        sku: "PONG-1L",
        originalPrice: 240,
        price: 200,
        stock: 100,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Ponga%20Oil%201%20Litre/VS-Gold-Ponga-Oil-1-Litre.jpg?updatedAt=1789281326731",
      },
      {
        label: "5 Litre Can",
        sku: "PONG-5L",
        originalPrice: 1200,
        price: 950,
        stock: 50,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Ponga%20Oil%205%20Litre%20Can/Ponga-Oil-5-Litre-Can-1536x1229.jpg?updatedAt=1789281326395",
      },
      {
        label: "16 Liter Tin",
        sku: "PONG-16L-TIN",
        originalPrice: 3500,
        price: 2700,
        stock: 30,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/Vs%20Gold%20Ponga%20Oil%2015%20Kg%20Tin/Pongam-Oil-15-Kg-Tin.jpg?updatedAt=1789281326893",
      },
    ],
  },

  // 6. NEEM OIL (no "Cold Pressed" in name)
  {
    name: "Neem Oil",
    shortDescription: "Pure Natural Neem Oil | Gst 5%",
    description:
      "<p>Pure Neem Oil (Veppam Ennai) extracted from premium neem seeds. Widely cherished for skin purifying, hair wellness, and natural organic plant protection.</p>",
    categorySlug: "traditional-oils",
    image:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Neem%20Oil%201%20Litre/VS-Gold-Neem-Oil-1-Litre.jpg?updatedAt=1789281326615",
    tags: [
      "neem oil",
      "veppam ennai",
      "organic gardening",
      "skin care",
      "traditional oil",
    ],
    variants: [
      {
        label: "500 ML",
        sku: "NEEM-500ML",
        originalPrice: 170,
        price: 140,
        stock: 80,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Neem%20Oil%201%20Litre/VS-Gold-Neem-Oil-1-Litre.jpg?updatedAt=1789281326615",
      },
      {
        label: "1 Liter Bottle",
        sku: "NEEM-1L",
        originalPrice: 320,
        price: 260,
        stock: 100,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Neem%20Oil%201%20Litre/VS-Gold-Neem-Oil-1-Litre.jpg?updatedAt=1789281326615",
      },
      {
        label: "5 Litre Can",
        sku: "NEEM-5L",
        originalPrice: 1600,
        price: 1250,
        stock: 50,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Neem%20Oil%205%20Litre%20Can/Neem-Oil-5-Litre-Can-1536x1229.jpg?updatedAt=1789281326433",
      },
      {
        label: "16 Liter Tin",
        sku: "NEEM-16L-TIN",
        originalPrice: 4500,
        price: 3600,
        stock: 30,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/Vs%20Gold%20Neem%20Oil%2015%20Kg%20Tin/Neem-Oil-15-Kg-Tin.jpg?updatedAt=1789281326881",
      },
    ],
  },

  // 7. PURE COW GHEE
  {
    name: "Pure Cow Ghee",
    shortDescription: "Pure Traditional Desi Cow Ghee | Gst 5%",
    description:
      "<p>Pure Desi Cow Ghee, slowly simmered using traditional methods to yield aromatic golden granules with divine taste and supreme purity.</p>",
    categorySlug: "pure-cow-ghee",
    image:
      "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Uthukuli%20Ghee%201%20Litre/20250925_222958_0000%20(1).png?updatedAt=1789281326869",
    isBestSeller: true,
    tags: [
      "pure cow ghee",
      "cow ghee",
      "desi cow ghee",
      "a2 bilona ghee",
      "traditional ghee",
    ],
    variants: [
      {
        label: "100 ML",
        sku: "GHEE-100ML",
        originalPrice: 80,
        price: 70,
        stock: 150,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Uthukuli%20Ghee%20100%20ML/20250925_222958_0000.png?updatedAt=1789281326752",
      },
      {
        label: "200 ML",
        sku: "GHEE-200ML",
        originalPrice: 160,
        price: 140,
        stock: 120,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Uthukuli%20Ghee%20200%20ML/20250925_222958_0000%20(1).png?updatedAt=1789281326880",
      },
      {
        label: "500 ML",
        sku: "GHEE-500ML",
        originalPrice: 400,
        price: 350,
        stock: 100,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Uthukuli%20Ghee%20500%20ML/20250925_222958_0000.png?updatedAt=1789281326852",
      },
      {
        label: "1 Litre",
        sku: "GHEE-1L",
        originalPrice: 800,
        price: 700,
        stock: 90,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Uthukuli%20Ghee%201%20Litre/20250925_222958_0000%20(1).png?updatedAt=1789281326869",
      },
      {
        label: "5 Litre Can",
        sku: "GHEE-5L",
        originalPrice: 4000,
        price: 3250,
        stock: 35,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20Gold%20Uthukuli%20Ghee%20-%205%20Litre%20Can/IMG-20250925-WA0135-768x1004.jpg?updatedAt=1789281326288",
      },
      {
        label: "15 Kg Tin",
        sku: "GHEE-15KG",
        originalPrice: 11500,
        price: 9500,
        stock: 20,
        image:
          "https://ik.imagekit.io/zxpphru8x/vsoilmill/VS%20GOLD%20UTHUKULI%20COW%20GHEE%2015%20Kg%20Tin/IMG-20250916-WA0025.jpg?updatedAt=1789281326693",
      },
    ],
  },
];

async function seed() {
  const allowed = checkSeedAllowed(process.env, process.argv.slice(2));
  if (!allowed.ok) {
    console.error(allowed.error);
    process.exit(1);
  }
  const { adminEmail, adminPassword } = allowed.config;

  await connectDb();

  await prisma.$transaction([
    prisma.review.deleteMany({}),
    prisma.orderItem.deleteMany({}),
    prisma.order.deleteMany({}),
    prisma.whatsAppClick.deleteMany({}),
    prisma.carousel.deleteMany({}),
    prisma.product.deleteMany({}),
    prisma.category.deleteMany({}),
    prisma.user.deleteMany({}),
  ]);

  // Seed creates a starter admin from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
  const passwordHash = await bcrypt.hash(adminPassword, AUTH.bcryptRounds);

  await prisma.user.create({
    data: {
      name: "Healargo Admin",
      email: adminEmail,
      passwordHash,
      role: USER_ROLES.ADMIN,
      phone: "",
    },
  });

  const createdCategories = await Promise.all(
    categories.map((c) =>
      prisma.category.create({
        data: { ...c, isActive: true },
      }),
    ),
  );
  const categoryMap = Object.fromEntries(
    createdCategories.map((c) => [c.slug, c.id]),
  );

  const usedSlugs = new Set<string>();

  for (const product of products) {
    const categoryId = categoryMap[product.categorySlug];
    if (!categoryId) continue;

    let baseSlug = slugify(product.name);
    if (!baseSlug) baseSlug = "product";
    let productSlug = baseSlug;
    let counter = 1;
    while (usedSlugs.has(productSlug)) {
      productSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    usedSlugs.add(productSlug);

    const variantImages = product.variants
      .map((v) => v.image)
      .filter((img): img is string => Boolean(img?.trim()));
    const allImages = Array.from(
      new Set(
        [product.image, ...variantImages, ...(product.images ?? [])].filter(
          Boolean,
        ),
      ),
    );

    const variants = product.variants.map((variant) => ({
      ...variant,
      _id: crypto.randomUUID(),
    }));

    await prisma.product.create({
      data: {
        name: product.name,
        slug: productSlug,
        shortDescription: product.shortDescription,
        description: product.description,
        images: allImages,
        categoryId,
        variants: variants as unknown as Prisma.InputJsonValue,
        tags: product.tags ?? [],
        isActive: true,
        isBestSeller: product.isBestSeller ?? false,
        isNewArrival: product.isNewArrival ?? false,
        seo: (product.seo ?? {
          metaTitle: `${product.name} | Healargo`,
          metaDescription: `Buy pure ${product.name} online from Healargo. 100% natural, traditionally crafted, delivered across India.`,
        }) as unknown as Prisma.InputJsonValue,
        averageRating: 0,
        reviewCount: 0,
      },
    });
  }

  const carouselCount = await prisma.carousel.count();
  if (carouselCount === 0) {
    await prisma.carousel.createMany({
      data: [
        {
          imageUrl: "https://ik.imagekit.io/mnm0iz0ng2/banner/1.png",
          navigationLink: "/shop",
          headline: "Pure, Traditional Cold-Pressed Oils",
          subheadline:
            "Cold-pressed at low temperatures to retain natural nutrients, aroma, and rich taste.",
          buttonText: "Shop All Oils",
          altText: "Healargo pure cold-pressed oils",
          sortOrder: 1,
          isActive: true,
        },
        {
          imageUrl: "https://ik.imagekit.io/mnm0iz0ng2/banner/2.png",
          navigationLink: "/categories/pure-cow-ghee",
          headline: "Pure Traditional A2 Cow Ghee",
          subheadline:
            "Slow-cooked traditionally with rich golden grains, heavenly aroma, and supreme purity.",
          buttonText: "Explore Pure Ghee",
          altText: "Pure Traditional A2 Cow Ghee",
          sortOrder: 2,
          isActive: true,
        },
        {
          imageUrl: "https://ik.imagekit.io/mnm0iz0ng2/category/Wooden-Pressed.jpg",
          navigationLink: "/bestsellers",
          headline: "Farm-Fresh Sesame & Coconut Oils",
          subheadline:
            "Direct from local farmers to our traditional cold-press mill, unrefined and 100% natural.",
          buttonText: "View Best Sellers",
          altText: "Cold-pressed sesame and coconut oil bottles",
          sortOrder: 3,
          isActive: true,
        },
      ],
    });
    console.log("Seeded 3 initial carousel slides.");
  }

  console.log(`Seed complete: ${products.length} products created.`);
  console.log(`Admin: ${adminEmail} (password from SEED_ADMIN_PASSWORD)`);
  await prisma.$disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
