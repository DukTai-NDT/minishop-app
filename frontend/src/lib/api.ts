import type { ApiResult, Category, Product } from "@/types";

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
export async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const body = (await response.json()) as ApiResult<T>;
  if (!response.ok || !body.success)
    throw new Error(body.error?.message ?? "Không thể kết nối với cửa hàng.");
  return body;
}
export type ProductList = {
  items: Product[];
  pagination: { page: number; limit: number; total: number; pages: number };
};
export const getProducts = (query = "") => request<ProductList>(`/products?limit=24${query}`);
export const getCategories = () => request<Category[]>("/categories");
