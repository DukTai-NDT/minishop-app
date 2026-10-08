import { Router } from "express";
import { categories, product, products } from "../controllers/productController.js";
import { orderSummary, placeOrder } from "../controllers/orderController.js";
import { prisma } from "../lib/prisma.js";

export const api = Router();
api.get("/health", (_req, res) =>
  res.json({
    success: true,
    data: { status: "ok", service: "minishop-api", uptime: process.uptime() },
    message: "Service is healthy.",
  })
);
api.get("/ready", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({
    success: true,
    data: { status: "ready", database: "connected" },
    message: "Service is ready.",
  });
});
api.get("/categories", categories);
api.get("/products", products);
api.get("/products/:id", product);
api.post("/orders", placeOrder);
api.get("/orders/:id", orderSummary);
