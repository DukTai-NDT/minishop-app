"use client";
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { Product } from "@/types";
export type CartItem = { product: Product; quantity: number };
type CartContextType = {
  items: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  add: (product: Product) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};
const CartContext = createContext<CartContextType | null>(null);
const empty: CartItem[] = [];
let snapshot = empty;
let lastRaw: string | null = null;
const listeners = new Set<() => void>();
function getItems() {
  if (typeof window === "undefined") return empty;
  const raw = localStorage.getItem("minishop-cart");
  if (raw !== lastRaw) {
    lastRaw = raw;
    try {
      snapshot = raw ? (JSON.parse(raw) as CartItem[]) : empty;
    } catch {
      snapshot = empty;
    }
  }
  return snapshot;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === "minishop-cart") {
      lastRaw = null;
      listeners.forEach((notify) => notify());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
function updateItems(updater: (current: CartItem[]) => CartItem[]) {
  snapshot = updater(getItems());
  lastRaw = JSON.stringify(snapshot);
  localStorage.setItem("minishop-cart", lastRaw);
  listeners.forEach((listener) => listener());
}
export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getItems, () => empty);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const value = useMemo<CartContextType>(
    () => ({
      items,
      hydrated,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0),
      add: (product) =>
        updateItems((current) => {
          const found = current.find((item) => item.product.id === product.id);
          return found
            ? current.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
                  : item
              )
            : [...current, { product, quantity: 1 }];
        }),
      setQuantity: (id, quantity) =>
        updateItems((current) =>
          quantity <= 0
            ? current.filter((item) => item.product.id !== id)
            : current.map((item) =>
                item.product.id === id
                  ? { ...item, quantity: Math.min(quantity, item.product.stock) }
                  : item
              )
        ),
      remove: (id) => updateItems((current) => current.filter((item) => item.product.id !== id)),
      clear: () => updateItems(() => []),
    }),
    [items, hydrated]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
