import { Suspense } from "react";
import Storefront from "./storefront";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="page-state">Opening the shop…</div>}>
      <Storefront />
    </Suspense>
  );
}
