import { z } from "zod";

export const orderSchema = z
  .object({
    customerName: z.string().trim().min(2).max(120),
    customerEmail: z.string().trim().email().max(254),
    customerPhone: z.string().trim().min(7).max(30),
    shippingAddress: z.string().trim().min(8).max(500),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().min(1).max(99),
        })
      )
      .min(1)
      .max(50),
  })
  .superRefine((value, context) => {
    const ids = value.items.map((item) => item.productId);
    if (new Set(ids).size !== ids.length)
      context.addIssue({
        code: "custom",
        path: ["items"],
        message: "Each product may appear only once.",
      });
  });

export type CreateOrderInput = z.infer<typeof orderSchema>;
