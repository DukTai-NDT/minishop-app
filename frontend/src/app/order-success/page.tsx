"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { request } from "@/lib/api";
import { money } from "@/lib/utils";
import type { OrderSummary } from "@/types";
export default function OrderSuccessPage() {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      try {
        const id = new URLSearchParams(window.location.search).get("id");
        if (!id) throw new Error("Order reference is missing.");
        const token = sessionStorage.getItem(`minishop-order-${id}`);
        if (!token) throw new Error("This order summary is no longer available in this browser.");
        const result = await request<OrderSummary>(
          `/orders/${id}?token=${encodeURIComponent(token)}`
        );
        setOrder(result.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load the order.");
      }
    })();
  }, []);
  if (error)
    return (
      <div className="page-state">
        <h1>We couldn’t load this order.</h1>
        <p>{error}</p>
        <Link className="text-link" href="/">
          Back to MiniShop <ArrowRight size={15} />
        </Link>
      </div>
    );
  if (!order) return <div className="page-state">Confirming your order…</div>;
  return (
    <div className="success-page">
      <div className="success-check">
        <Check size={25} />
      </div>
      <p className="eyebrow">Well found, well chosen</p>
      <h1>
        Your everyday just got
        <br />
        <em>a little brighter.</em>
      </h1>
      <p className="success-intro">
        Your order is in good hands. We’ve saved your pieces and will take care of the rest.
      </p>
      <div className="order-receipt">
        <div className="receipt-top">
          <div>
            <span>ORDER REFERENCE</span>
            <strong>{order.id.slice(0, 8).toUpperCase()}</strong>
          </div>
          <div>
            <span>STATUS</span>
            <strong>{order.status}</strong>
          </div>
        </div>
        {order.items.map((item, i) => (
          <div className="receipt-item" key={`${item.product.name}-${i}`}>
            <div className="receipt-thumb">
              <Image src={item.product.imageUrl} alt="" fill sizes="56px" />
            </div>
            <div>
              <strong>{item.product.name}</strong>
              <span>Quantity {item.quantity}</span>
            </div>
            <b>{money(Number(item.unitPrice) * item.quantity)}</b>
          </div>
        ))}
        <div className="receipt-total">
          <span>Total</span>
          <strong>{money(order.totalAmount)}</strong>
        </div>
      </div>
      <Link href="/" className="button button-dark">
        Back to the little things <ArrowRight size={16} />
      </Link>
    </div>
  );
}
