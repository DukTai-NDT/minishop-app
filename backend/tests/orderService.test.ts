import { beforeEach, describe, expect, it, vi } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";

const { transaction, findMany, create, updateMany } = vi.hoisted(() => ({
  transaction: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
}));
vi.mock("../src/lib/prisma.js", () => ({ prisma: { $transaction: transaction } }));
const { createOrder } = await import("../src/services/orderService.js");
const id = "a86a4a7c-c2b8-46b4-9609-fc47f42272aa";
const input = {
  customerName: "Nguyen An",
  customerEmail: "an@example.com",
  customerPhone: "+15550100",
  shippingAddress: "12 Example Street, District 1",
  items: [{ productId: id, quantity: 3 }],
};

describe("order service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({ product: { findMany, updateMany }, order: { create } })
    );
    findMany.mockResolvedValue([
      {
        id,
        name: "Arc headphones",
        price: new Decimal("19.95"),
        stock: 8,
        imageUrl: "/products/electronics.svg",
      },
    ]);
    create.mockImplementation(async ({ data }: { data: { totalAmount: Decimal } }) => ({
      id: "order-id",
      totalAmount: data.totalAmount,
    }));
    updateMany.mockResolvedValue({ count: 1 });
  });
  it("uses decimal database prices and atomically decrements stock", async () => {
    const result = await createOrder(input);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ totalAmount: new Decimal("59.85") }),
      })
    );
    expect(updateMany).toHaveBeenCalledWith({
      where: { id, isActive: true, stock: { gte: 3 } },
      data: { stock: { decrement: 3 } },
    });
    expect(result.lookupToken).toHaveLength(43);
  });
  it("rejects an order when the product has insufficient stock", async () => {
    findMany.mockResolvedValueOnce([
      {
        id,
        name: "Arc headphones",
        price: new Decimal("19.95"),
        stock: 2,
        imageUrl: "/products/electronics.svg",
      },
    ]);
    await expect(createOrder(input)).rejects.toMatchObject({
      code: "INSUFFICIENT_STOCK",
      status: 409,
    });
    expect(create).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });
  it("rejects and rolls back if stock changes before the conditional decrement", async () => {
    updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(createOrder(input)).rejects.toMatchObject({
      code: "INSUFFICIENT_STOCK",
      status: 409,
    });
    expect(create).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });
});
