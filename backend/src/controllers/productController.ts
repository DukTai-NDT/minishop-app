import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import { getCategories, getProduct, listProducts } from "../repositories/productRepository.js";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  category: z.string().trim().max(80).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(["newest", "price-asc", "price-desc"]).default("newest"),
});

export async function products(req: Request, res: Response) {
  const query = querySchema.safeParse(req.query);
  if (!query.success) throw new AppError(400, "VALIDATION_ERROR", "Invalid product query.");
  res.json({ success: true, data: await listProducts(query.data), message: "Products loaded." });
}
export async function product(req: Request, res: Response) {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) throw new AppError(400, "INVALID_PRODUCT_ID", "Product ID must be a UUID.");
  const result = await getProduct(id.data);
  if (!result) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
  res.json({ success: true, data: result, message: "Product loaded." });
}
export async function categories(_req: Request, res: Response) {
  res.json({ success: true, data: await getCategories(), message: "Categories loaded." });
}
