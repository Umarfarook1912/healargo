import "dotenv/config";
import { connectDb, prisma } from "../src/lib/db/prisma";

const initialCarousels = [
  {
    imageUrl: "https://ik.imagekit.io/mnm0iz0ng2/banner/1.png",
    navigationLink: "/shop",
    headline: "Pure, Traditional Wood-Pressed Oils",
    subheadline: "Cold-pressed with Vaagai wood to retain natural nutrients, aroma, and rich taste.",
    buttonText: "Shop All Oils",
    altText: "Healargo wood-pressed cold pressed oils",
    sortOrder: 1,
    isActive: true,
  },
  {
    imageUrl: "https://ik.imagekit.io/mnm0iz0ng2/banner/2.png",
    navigationLink: "/categories/pure-cow-ghee",
    headline: "Authentic Uthukuli A2 Cow Ghee",
    subheadline: "Slow-cooked traditionally with rich golden grains, heavenly aroma, and supreme purity.",
    buttonText: "Explore Pure Ghee",
    altText: "Authentic Uthukuli A2 Cow Ghee",
    sortOrder: 2,
    isActive: true,
  },
  {
    imageUrl: "https://ik.imagekit.io/mnm0iz0ng2/category/Wooden-Pressed.jpg",
    navigationLink: "/bestsellers",
    headline: "Farm-Fresh Groundnut & Sesame Oils",
    subheadline: "Direct from local farmers to our traditional expeller mill, unrefined and 100% natural.",
    buttonText: "View Best Sellers",
    altText: "Wooden pressed groundnut oil bottles",
    sortOrder: 3,
    isActive: true,
  },
];

async function seedCarousels() {
  await connectDb();
  console.log("Connected to database for carousel seed.");

  const count = await prisma.carousel.count();
  if (count > 0) {
    console.log(`Carousels already exist (${count} slides found). Skipping seed.`);
  } else {
    const created = await prisma.carousel.createMany({ data: initialCarousels });
    console.log(`Successfully seeded ${created.count} carousel slides.`);
  }

  await prisma.$disconnect();
}

seedCarousels().catch(async (err) => {
  console.error("Seeding error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
