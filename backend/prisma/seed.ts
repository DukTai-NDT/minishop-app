import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const catalog = [
  {
    category: "Electronics",
    slug: "electronics",
    products: [
      [
        "Arc wireless headphones",
        "arc-wireless-headphones",
        "Balanced sound, soft memory foam and a 36-hour battery for the everyday commute.",
        "89.00",
        18,
      ],
      [
        "Studio desk speaker",
        "studio-desk-speaker",
        "A compact speaker with warm, room-filling sound and a considered walnut finish.",
        "129.00",
        9,
      ],
      [
        "Pocket instant camera",
        "pocket-instant-camera",
        "Capture small moments in a soft, tactile instant format. Film pack sold separately.",
        "149.00",
        12,
      ],
      [
        "Halo reading lamp",
        "halo-reading-lamp",
        "A dimmable, warm LED lamp designed for a quieter evening routine.",
        "64.00",
        22,
      ],
    ],
  },
  {
    category: "Fashion",
    slug: "fashion",
    products: [
      [
        "Everyday linen shirt",
        "everyday-linen-shirt",
        "Breathable European linen with a relaxed fit that works from morning to late afternoon.",
        "72.00",
        24,
      ],
      [
        "Sunday knit cardigan",
        "sunday-knit-cardigan",
        "A soft cotton blend layer with a clean silhouette and natural corozo buttons.",
        "118.00",
        7,
      ],
      [
        "Essential canvas tote",
        "essential-canvas-tote",
        "Heavyweight organic cotton with a roomy interior for errands and everyday carry.",
        "38.00",
        35,
      ],
      [
        "Relaxed cotton trousers",
        "relaxed-cotton-trousers",
        "Easy, tailored trousers in brushed cotton with a comfortable elastic back.",
        "94.00",
        0,
      ],
    ],
  },
  {
    category: "Home & Living",
    slug: "home-living",
    products: [
      [
        "Stoneware coffee set",
        "stoneware-coffee-set",
        "Two hand-finished stoneware cups with a satin glaze and gently irregular rims.",
        "48.00",
        16,
      ],
      [
        "Linen cushion cover",
        "linen-cushion-cover",
        "A richly textured flax linen cover, made to soften with every wash.",
        "42.00",
        20,
      ],
      [
        "Oak bedside tray",
        "oak-bedside-tray",
        "Solid oak, shaped into a simple landing place for the little things.",
        "56.00",
        11,
      ],
      [
        "Ripple glass vase",
        "ripple-glass-vase",
        "A sculptural recycled-glass vase that catches the light even without flowers.",
        "36.00",
        14,
      ],
    ],
  },
  {
    category: "Accessories",
    slug: "accessories",
    products: [
      [
        "Weekender carryall",
        "weekender-carryall",
        "A sturdy, considered overnight bag with a padded laptop sleeve and shoe pocket.",
        "158.00",
        6,
      ],
      [
        "Everyday leather wallet",
        "everyday-leather-wallet",
        "Slim full-grain leather with just enough room for the cards you use.",
        "68.00",
        0,
      ],
      [
        "Contour stainless bottle",
        "contour-stainless-bottle",
        "Double-wall insulated stainless steel keeps drinks cool through long afternoons.",
        "34.00",
        30,
      ],
      [
        "Soft frame sunglasses",
        "soft-frame-sunglasses",
        "Lightweight recycled acetate frames with full UV400 lens protection.",
        "82.00",
        13,
      ],
    ],
  },
  {
    category: "Lifestyle",
    slug: "lifestyle",
    products: [
      [
        "Daily ritual journal",
        "daily-ritual-journal",
        "A linen-bound, undated journal with thoughtfully open pages for daily notes.",
        "28.00",
        42,
      ],
      [
        "Botanical candle",
        "botanical-candle",
        "A slow-burning soy wax candle with notes of cedar, fig leaf and quiet mornings.",
        "32.00",
        26,
      ],
      [
        "Slow morning tea set",
        "slow-morning-tea-set",
        "A calming loose-leaf blend with a small infuser for a gentler start.",
        "24.00",
        19,
      ],
      [
        "Travel yoga mat",
        "travel-yoga-mat",
        "A grippy, foldable natural rubber mat that slips easily into a weekend bag.",
        "76.00",
        8,
      ],
    ],
  },
];

async function main() {
  for (const group of catalog) {
    const category = await prisma.category.upsert({
      where: { slug: group.slug },
      update: { name: group.category },
      create: { name: group.category, slug: group.slug },
    });
    for (const [name, slug, description, price, stock] of group.products) {
      await prisma.product.upsert({
        where: { slug: slug as string },
        update: {
          name: name as string,
          description: description as string,
          price: price as string,
          stock: stock as number,
          categoryId: category.id,
          imageUrl: `/products/${group.slug}.svg`,
          isActive: true,
        },
        create: {
          name: name as string,
          slug: slug as string,
          description: description as string,
          price: price as string,
          stock: stock as number,
          categoryId: category.id,
          imageUrl: `/products/${group.slug}.svg`,
        },
      });
    }
  }
  console.log("Seeded 5 categories and 20 products.");
}

main().finally(() => prisma.$disconnect());
