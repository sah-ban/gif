"use client";

import dynamic from "next/dynamic";

const GiphySearch = dynamic(() => import("@/components/GiphySearch"), {
  ssr: false,
});

export default function App() {
  return <GiphySearch />;
}
