"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { money } from "@/lib/utils";
import { request } from "@/lib/api";
type PlacedOrder = { id: string; lookupToken: string };
export default function CheckoutPage() {
  const { items, subtotal, hydrated, clear } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !items.length) return;
    setBusy(true);
    setError("");
    const fields = new FormData(event.currentTarget);
    try {
      const result = await request<PlacedOrder>("/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: fields.get("name"),
          customerEmail: fields.get("email"),
          customerPhone: fields.get("phone"),
          shippingAddress: fields.get("address"),
          items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        }),
      });
      sessionStorage.setItem(`minishop-order-${result.data.id}`, result.data.lookupToken);
      clear();
      router.push(`/order-success?id=${result.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể đặt hàng. Vui lòng thử lại.");
      setBusy(false);
    }
  }
  if (!hydrated) return <div className="page-state">Preparing checkout…</div>;
  if (!items.length)
    return (
      <div className="page-state">
        <h1>Your bag is empty.</h1>
        <Link className="text-link" href="/">
          Return to the shop <ArrowRight size={15} />
        </Link>
      </div>
    );
  return (
    <div className="checkout-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">One last little thing</p>
          <h1>Make it yours.</h1>
        </div>
        <Link className="text-link" href="/cart">
          <ArrowLeft size={15} /> Back to bag
        </Link>
      </div>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <div className="form-section-heading">
            <span>01</span>
            <div>
              <h2>Where to find you</h2>
              <p>Your details help us get everything to the right place.</p>
            </div>
          </div>
          <label>
            Full name
            <input
              name="name"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              placeholder="Your name"
            />
          </label>
          <div className="form-split">
            <label>
              Email address
              <input
                name="email"
                required
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label>
              Phone number
              <input
                name="phone"
                required
                minLength={7}
                maxLength={30}
                autoComplete="tel"
                placeholder="+1 (555) 000-0000"
              />
            </label>
          </div>
          <label>
            Shipping address
            <textarea
              name="address"
              required
              minLength={8}
              maxLength={500}
              autoComplete="street-address"
              rows={3}
              placeholder="Street, city, postal code, country"
            />
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <button disabled={busy} className="button button-dark place-order">
            {busy ? "Placing your order…" : "Place your order"}
            <ArrowRight size={17} />
          </button>
          <p className="checkout-privacy">
            <LockKeyhole size={13} /> Your information is used only to fulfill this order.
          </p>
        </form>
        <aside className="checkout-summary">
          <p className="eyebrow">A little recap</p>
          <h2>
            Your pieces <span>({items.length})</span>
          </h2>
          <div className="checkout-items">
            {items.map(({ product, quantity }) => (
              <div className="checkout-item" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <span>
                    Qty {quantity} · {money(product.price)} each
                  </span>
                </div>
                <b>{money(Number(product.price) * quantity)}</b>
              </div>
            ))}
          </div>
          <div className="summary-line">
            <span>Shipping</span>
            <span>Complimentary</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <p className="secure-note">Your order will be confirmed as soon as it’s placed.</p>
        </aside>
      </div>
    </div>
  );
}
