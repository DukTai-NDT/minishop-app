"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { request } from "@/lib/api";
import type { Product } from "@/types";
import { money } from "@/lib/utils";
import { useCart } from "@/store/cart";
export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  useEffect(() => {
    void params.then((p) => {
      setId(p.id);
      return request<Product>(`/products/${p.id}`)
        .then((r) => setProduct(r.data))
        .catch((e: Error) => setError(e.message));
    });
  }, [params]);
  if (error)
    return (
      <div className="page-state">
        <h1>We couldn’t find that piece.</h1>
        <Link className="text-link" href="/">
          Back to the shop <ArrowLeft size={15} />
        </Link>
      </div>
    );
  if (!product) return <div className="page-state">Loading product…</div>;
  return (
    <div className="detail-page">
      <div className="breadcrumbs">
        <Link href="/">Shop</Link>
        <span>/</span>
        <Link href={`/?category=${product.category.slug}`}>{product.category.name}</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>
      <div className="detail-layout">
        <div className="detail-image">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 800px) 100vw, 55vw"
          />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{product.category.name} · Everyday, considered</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{money(product.price)}</p>
          <div className="detail-rule" />
          <p className="detail-description">{product.description}</p>
          <p className={product.stock ? "availability" : "availability sold"}>
            <span />
            {product.stock ? `${product.stock} ready to find a home` : "Currently out of stock"}
          </p>
          {product.stock > 0 && (
            <div className="purchase-row">
              <div className="quantity-picker">
                <button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}>
                  <Minus size={15} />
                </button>
                <span>{qty}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                >
                  <Plus size={15} />
                </button>
              </div>
              <button
                className="button button-dark add-button"
                onClick={() => {
                  for (let i = 0; i < qty; i += 1) add(product);
                  setAdded(true);
                }}
              >
                {added ? "Added to your bag ✓" : "Add to bag"}
                <ShoppingBag size={17} />
              </button>
            </div>
          )}
          <div className="detail-promise">
            <span>✳</span> Carefully selected, made for everyday living.
          </div>
          <Link className="text-link back-link" href="/">
            <ArrowLeft size={14} /> Back to the collection
          </Link>
        </div>
      </div>
      <span className="detail-id">OBJECT NO. {id.slice(0, 8).toUpperCase()}</span>
    </div>
  );
}
