"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/store/cart";
export function Header() {
  const { count } = useCart();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(`/?search=${encodeURIComponent(search)}`);
  };
  return (
    <>
      <div className="announcement">
        A little more joy in the everyday <span>— complimentary shipping, always</span>
      </div>
      <header className="site-header">
        <Link className="wordmark" href="/">
          mini<span>shop</span>
          <i>®</i>
        </Link>
        <nav className={open ? "nav-links open" : "nav-links"}>
          <Link href="/?category=electronics">Objects</Link>
          <Link href="/?category=fashion">Wear</Link>
          <Link href="/?category=home-living">Home</Link>
          <Link href="/#story">Our story</Link>
        </nav>
        <div className="header-actions">
          <form className="search-form" onSubmit={submit}>
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search the shop"
              aria-label="Search products"
            />
          </form>
          <Link aria-label={`Shopping bag, ${count} items`} className="bag-link" href="/cart">
            <ShoppingBag size={20} />
            <span>{count}</span>
          </Link>
          <button className="mobile-menu" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
export function Newsletter() {
  return (
    <section className="newsletter">
      <div>
        <p className="eyebrow">A note from us</p>
        <h2>Good things, occasionally.</h2>
        <p>New finds, thoughtful ideas, and a little inspiration for your everyday.</p>
      </div>
      <form onSubmit={(e) => e.preventDefault()}>
        <input aria-label="Email address" type="email" placeholder="Your email address" />
        <button aria-label="Subscribe">
          <ArrowRight />
        </button>
      </form>
    </section>
  );
}
