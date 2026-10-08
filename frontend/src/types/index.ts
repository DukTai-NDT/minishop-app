export type Category = { id: string; name: string; slug: string; _count?: { products: number } };
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  imageUrl: string;
  stock: number;
  category: Category;
};
export type ApiResult<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: { code: string; message: string };
};
export type OrderSummary = {
  id: string;
  totalAmount: string;
  status: string;
  items: { quantity: number; unitPrice: string; product: { name: string; imageUrl: string } }[];
};
