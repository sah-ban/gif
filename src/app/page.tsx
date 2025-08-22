"use client";

import GiphySearch from "@/components/GiphySearch";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto p-4 text-center bg-amber-800">
      <h1 className="text-3xl font-bold mb-4 text-white">Giphy Search App</h1>
      <GiphySearch />
    </div>
  );
}
