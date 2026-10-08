import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import type { CreateOrderInput } from "../validators/order.js";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createOrder(input: CreateOrderInput) {
  const lookupToken = randomBytes(32).toString("base64url");
  const order = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const products = await tx.product.findMany({
        where: { id: { in: input.items.map((item) => item.productId) }, isActive: true },
        select: { id: true, name: true, price: true, stock: true, imageUrl: true },
      });
      if (products.length !== input.items.length)
        throw new AppError(422, "PRODUCT_UNAVAILABLE", "One or more products are unavailable.");
      const byId = new Map(products.map((product) => [product.id, product]));
      let total = new Decimal(0);
      const lineItems = input.items.map((item) => {
        const product = byId.get(item.productId);
        if (!product || product.stock < item.quantity)
          throw new AppError(
            409,
            "INSUFFICIENT_STOCK",
            `${product?.name ?? "A product"} does not have enough stock.`
          );
        total = total.plus(product.price.mul(item.quantity));
        return { productId: item.productId, quantity: item.quantity, unitPrice: product.price };
      });
      if (total.greaterThan("99999999.99"))
        throw new AppError(
          422,
          "ORDER_TOTAL_TOO_LARGE",
          "The order total exceeds the supported limit."
        );
      const created = await tx.order.create({
        data: {
          lookupTokenHash: hashToken(lookupToken),
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          shippingAddress: input.shippingAddress,
          totalAmount: total,
          items: { create: lineItems },
        },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          items: {
            select: {
              quantity: true,
              unitPrice: true,
              product: { select: { id: true, name: true, imageUrl: true } },
            },
          },
        },
      });
      for (const item of input.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1)
          throw new AppError(
            409,
            "INSUFFICIENT_STOCK",
            "Stock changed while the order was being placed. Please review your cart."
          );
      }
      return created;
    },
    { isolationLevel: "Serializable" }
  );
  return { order, lookupToken };
}

export async function getOrderForCustomer(id: string, token: string | undefined) {
  if (!token) throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
  const expected = Buffer.from(hashToken(token));
  const found = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      lookupTokenHash: true,
      totalAmount: true,
      status: true,
      createdAt: true,
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          product: { select: { name: true, imageUrl: true } },
        },
      },
    },
  });
  const actual = Buffer.from(found?.lookupTokenHash ?? "".padEnd(64, "0"));
  if (!found || actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
  const { lookupTokenHash, ...summary } = found;
  void lookupTokenHash;
  return summary;
}
