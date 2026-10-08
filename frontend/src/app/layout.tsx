import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/store/cart";
import { Header, Newsletter } from "@/components/layout/header";
import Link from "next/link";
import { Instagram, MoveUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "MiniShop — thoughtful things for everyday",
  description: "A small collection of useful, beautiful things for everyday life.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Newsletter />
          <footer className="footer">
            <Link className="wordmark" href="/">
              mini<span>shop</span>
              <i>®</i>
            </Link>
            <p>Thoughtful things, for everyday living.</p>
            <div className="footer-links">
              <Link href="/">Shop all</Link>
              <Link href="/#story">Our story</Link>
              <a href="mailto:hello@minishop.local">
                Get in touch <MoveUpRight size={13} />
              </a>
              <a href="https://instagram.com" aria-label="Instagram">
                <Instagram size={16} />
              </a>
            </div>
            <small>© 2026 MiniShop Studio. Made for the everyday.</small>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
