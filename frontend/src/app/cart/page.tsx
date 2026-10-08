"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { money } from "@/lib/utils";
export default function CartPage() {
  const { items, subtotal, setQuantity, remove, hydrated } = useCart();
  if (!hydrated) return <div className="page-state">Opening your bag…</div>;
  if (!items.length)
    return (
      <div className="empty-cart">
        <span className="empty-icon">✳</span>
        <p className="eyebrow">A little room for something lovely</p>
        <h1>
          Your bag is taking
          <br />
          <em>a quiet moment.</em>
        </h1>
        <p>There’s nothing in here just yet. Take a look around and see what finds you.</p>
        <Link className="button button-dark" href="/">
          Find your everyday things <ArrowRight size={16} />
        </Link>
      </div>
    );
  return (
    <div className="cart-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">Your considered collection</p>
          <h1>
            Your bag <span>({items.length})</span>
          </h1>
        </div>
        <Link className="text-link" href="/">
          <ArrowLeft size={15} /> Keep looking
        </Link>
      </div>
      <div className="cart-layout">
        <section className="cart-list">
          <div className="cart-head">
            <span>Piece</span>
            <span>Quantity</span>
            <span>Total</span>
            <span />
          </div>
          {items.map(({ product, quantity }) => (
            <article className="cart-row" key={product.id}>
              <Link className="cart-thumb" href={`/products/${product.id}`}>
                <Image src={product.imageUrl} alt={product.name} fill sizes="120px" />
              </Link>
              <div className="cart-product">
                <p className="product-category">{product.category.name}</p>
                <Link href={`/products/${product.id}`}>
                  <h2>{product.name}</h2>
                </Link>
                <p>{money(product.price)}</p>
              </div>
              <div className="quantity-picker cart-quantity">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(product.id, quantity - 1)}
                >
                  <Minus size={14} />
                </button>
                <span>{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  disabled={quantity >= product.stock}
                  onClick={() => setQuantity(product.id, quantity + 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
              <strong className="cart-line-total">{money(Number(product.price) * quantity)}</strong>
              <button
                className="remove-button"
                aria-label={`Remove ${product.name}`}
                onClick={() => remove(product.id)}
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </section>
        <aside className="cart-summary">
          <p className="eyebrow">A little summary</p>
          <h2>Order notes</h2>
          <div className="summary-line">
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <div className="summary-line">
            <span>Shipping</span>
            <span>Complimentary</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <Link href="/checkout" className="button button-dark checkout-button">
            Continue to checkout <ArrowRight size={16} />
          </Link>
          <p className="secure-note">✳ Thoughtful things, packed with care.</p>
        </aside>
      </div>
    </div>
  );
}
