"use client";

import GiphySearch from "@/components/GiphySearch";

export default function Home() {
  return (
<div className="min-h-screen w-full p-4 text-center bg-slate-800">
  <h1 className="text-3xl font-bold mb-4 text-white">Gif</h1>
  <GiphySearch />
</div>

  );
}
