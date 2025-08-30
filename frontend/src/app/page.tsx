"use client";

import Storefront from "@/components/Storefront";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[100vw] overflow-x-hidden">
        <Storefront />
      </div>
    </div>
  );
}