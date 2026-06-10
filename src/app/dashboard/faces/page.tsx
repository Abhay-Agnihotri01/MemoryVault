"use client";

import dynamic from "next/dynamic";

// Dynamically import the Face Dashboard and disable Server-Side Rendering.
// This completely prevents the Next.js SSR engine from crashing on face-api.js imports
// like "this.util.TextEncoder is not a constructor"
const FaceDashboardClient = dynamic(() => import("./FaceDashboardClient"), {
  ssr: false,
});

export default function FacesPage() {
  return <FaceDashboardClient />;
}
