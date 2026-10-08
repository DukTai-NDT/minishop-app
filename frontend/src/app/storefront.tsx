"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { getCategories, getProducts } from "@/lib/api";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import type { Category, Product } from "@/types";

const categoriesVisual = ["electronics", "fashion", "home-living", "accessories", "lifestyle"];
export default function Storefront() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get("category") ?? "";
  const search = searchParams.get("search") ?? "";
  const urlSort = searchParams.get("sort") ?? "newest";
  const [sortOverride, setSortOverride] = useState<string | null>(null);
  const sort = sortOverride ?? urlSort;
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void getCategories()
      .then((r) => {
        if (active) setCategories(r.data);
      })
      .catch(() => {});
    void getProducts(
      `&sort=${urlSort}${filter ? `&category=${encodeURIComponent(filter)}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`
    )
      .then((r) => {
        if (active) setProducts(r.data.items);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter, search, urlSort]);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <Sparkles size={14} /> The everyday edit · No. 04
          </p>
          <h1>
            Make room for
            <br />
            <em>the little things.</em>
          </h1>
          <p className="hero-lede">
            A considered collection of useful, beautiful things to make your everyday feel a little
            more like yours.
          </p>
          <Button asChild>
            <Link href="#shop">
              Explore the collection <ArrowRight size={17} />
            </Link>
          </Button>
          <div className="hero-note">
            <span className="note-dot" /> Curated with intention, made to be lived with.
          </div>
        </div>
        <div className="hero-art">
          <Image
            src="/products/home-living.svg"
            alt="A sunlit still life of everyday home objects"
            fill
            priority
          />
          <div className="hero-caption">
            Objects for slower mornings <span>01 / 05</span>
          </div>
          <span className="hero-sticker">
            Small
            <br />
            joys
            <br />
            <em>live here</em>
          </span>
        </div>
        <a className="scroll-hint" href="#categories">
          <ArrowDown size={14} /> Scroll to explore
        </a>
        <span className="hero-index">01 — THE COLLECTION</span>
      </section>
      <section className="categories section-wrap" id="categories">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Find your everyday</p>
            <h2>A place for everything.</h2>
          </div>
          <Link className="text-link" href="#shop">
            Shop all categories <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="category-grid">
          {categoriesVisual.map((slug, index) => {
            const category = categories.find((item) => item.slug === slug);
            return (
              <Link className="category-tile" href={`/?category=${slug}`} key={slug}>
                <div className={`category-image category-${index}`}>
                  <Image
                    src={`/products/${slug}.svg`}
                    alt=""
                    fill
                    sizes="(max-width: 700px) 50vw, 20vw"
                  />
                </div>
                <div>
                  <span>
                    {category?.name ??
                      ["Electronics", "Fashion", "Home & Living", "Accessories", "Lifestyle"][
                        index
                      ]}
                  </span>
                  <ArrowUpRight size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="collection section-wrap" id="shop">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The good things shelf</p>
            <h2>
              {search
                ? `Results for “${search}”`
                : filter
                  ? (categories.find((c) => c.slug === filter)?.name ?? "A considered collection")
                  : "A few things we love."}
            </h2>
          </div>
          <div className="collection-controls">
            <button
              onClick={() => {
                setSortOverride(null);
                router.push("/");
              }}
            >
              Everything
            </button>
            <label className="sort-label" htmlFor="sort-products">
              Sort
              <select
                id="sort-products"
                value={sort}
                onChange={(event) => {
                  const order = event.target.value;
                  setSortOverride(order);
                  const query = `&sort=${order}${filter ? `&category=${encodeURIComponent(filter)}` : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
                  void getProducts(query)
                    .then((r) => setProducts(r.data.items))
                    .catch((e: Error) => setError(e.message));
                }}
              >
                <option value="newest">Just in</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>
        </div>
        {loading ? (
          <div className="status-box">Finding the good things…</div>
        ) : error ? (
          <div className="status-box error-box">
            <p>{error}</p>
            <button className="text-link" onClick={() => router.refresh()}>
              Try again <ArrowRight size={15} />
            </button>
          </div>
        ) : products.length ? (
          <div className="product-grid">
            {products.map((item) => (
              <ProductCard product={item} key={item.id} />
            ))}
          </div>
        ) : (
          <div className="status-box">Nothing here just yet. Try another category.</div>
        )}
        <div className="center-link">
          <Link className="button button-outline" href="#categories">
            Explore all categories <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="story-banner" id="story">
        <div className="story-image">
          <Image
            src="/products/lifestyle.svg"
            alt="Thoughtful everyday rituals"
            fill
            sizes="50vw"
          />
        </div>
        <div className="story-copy">
          <p className="eyebrow">A little less, a little better</p>
          <h2>
            Keep the things
            <br />
            that <em>feel like you.</em>
          </h2>
          <p>
            We believe the things we live with should earn their place. So we look for pieces made
            with care, designed to last, and lovely enough to reach for every day.
          </p>
          <Link href="#categories" className="text-link">
            A little about us <ArrowUpRight size={16} />
          </Link>
        </div>
        <span className="story-mark">M.</span>
      </section>
    </>
  );
}
