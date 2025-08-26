"use client";

import dynamic from "next/dynamic";

const Tenor = dynamic(() => import("@/components/Tenor"), {
  ssr: false,
});

export default function App() {
  return <Tenor />;
}
