import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/lib/prisma.js", () => ({
  prisma: {
    product: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
    category: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));
const { prisma } = await import("../src/lib/prisma.js");
const { app } = await import("../src/app.js");

describe("MiniShop API", () => {
  beforeEach(() => vi.clearAllMocks());
  it("reports API health", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("ok");
  });
  it("checks the database before reporting readiness", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ "1": 1 }]);
    const response = await request(app).get("/api/ready");
    expect(response.status).toBe(200);
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
  });
  it("lists active products with requested filters and paging", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.product.count).mockResolvedValueOnce(0);
    const response = await request(app).get("/api/products?category=fashion&search=linen&page=2");
    expect(response.status).toBe(200);
    expect(response.body.data.pagination.page).toBe(2);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 12,
        where: expect.objectContaining({ isActive: true, category: { slug: "fashion" } }),
      })
    );
  });
  it("returns a product by UUID", async () => {
    const product = { id: "a86a4a7c-c2b8-46b4-9609-fc47f42272aa", name: "Arc headphones" };
    vi.mocked(prisma.product.findFirst).mockResolvedValueOnce(product as never);
    const response = await request(app).get(`/api/products/${product.id}`);
    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Arc headphones");
  });
  it("rejects malformed product IDs before querying the database", async () => {
    const response = await request(app).get("/api/products/not-a-uuid");
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_PRODUCT_ID");
    expect(prisma.product.findFirst).not.toHaveBeenCalled();
  });
  it("rejects invalid checkout input", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({ customerEmail: "bad", items: [] });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
  it("does not reveal orders when a lookup token is missing", async () => {
    const response = await request(app).get("/api/orders/a86a4a7c-c2b8-46b4-9609-fc47f42272aa");
    expect(response.status).toBe(404);
  });
});
