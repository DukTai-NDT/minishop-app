import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";
import { getOrderForCustomer, createOrder } from "../services/orderService.js";
import { orderSchema } from "../validators/order.js";

export async function placeOrder(req: Request, res: Response) {
  const input = orderSchema.safeParse(req.body);
  if (!input.success)
    throw new AppError(400, "VALIDATION_ERROR", input.error.issues[0]?.message ?? "Invalid order.");
  const result = await createOrder(input.data);
  res.status(201).json({
    success: true,
    data: { ...result.order, lookupToken: result.lookupToken },
    message: "Order placed successfully.",
  });
}
export async function orderSummary(req: Request, res: Response) {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) throw new AppError(404, "ORDER_NOT_FOUND", "Order not found.");
  const result = await getOrderForCustomer(
    id.data,
    typeof req.query.token === "string" ? req.query.token : undefined
  );
  res.json({ success: true, data: result, message: "Order loaded." });
}
