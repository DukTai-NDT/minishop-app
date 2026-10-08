import { prisma } from "../lib/prisma.js";

export async function listProducts(options: {
  page: number;
  limit: number;
  category?: string | undefined;
  search?: string | undefined;
  sort: "newest" | "price-asc" | "price-desc";
}) {
  const where = {
    isActive: true,
    ...(options.category ? { category: { slug: options.category } } : {}),
    ...(options.search ? { name: { contains: options.search, mode: "insensitive" as const } } : {}),
  };
  const orderBy =
    options.sort === "newest"
      ? { createdAt: "desc" as const }
      : { price: options.sort === "price-asc" ? ("asc" as const) : ("desc" as const) };
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.product.count({ where }),
  ]);
  return {
    items,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      pages: Math.ceil(total / options.limit),
    },
  };
}

export const getProduct = (id: string) =>
  prisma.product.findFirst({ where: { id, isActive: true }, include: { category: true } });
export const getCategories = () =>
  prisma.category.findMany({
    include: { _count: { select: { products: { where: { isActive: true } } } } },
    orderBy: { name: "asc" },
  });
