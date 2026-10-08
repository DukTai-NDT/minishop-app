"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import type { Product } from "@/types";
import { useCart } from "@/store/cart";
import { money } from "@/lib/utils";
export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  return (
    <article className="product-card">
      <Link href={`/products/${product.id}`} className="product-photo">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <span className="photo-arrow">
          <ArrowUpRight size={17} />
        </span>
        {product.stock === 0 && <span className="stock-badge">Sold out</span>}
      </Link>
      <div className="product-meta">
        <div>
          <p className="product-category">{product.category.name}</p>
          <Link href={`/products/${product.id}`}>
            <h3>{product.name}</h3>
          </Link>
        </div>
        <button
          className="quick-add"
          disabled={!product.stock}
          aria-label={`Add ${product.name} to bag`}
          onClick={() => add(product)}
        >
          {product.stock ? <Plus size={18} /> : "—"}
        </button>
      </div>
      <p className="product-price">{money(product.price)}</p>
    </article>
  );
}
