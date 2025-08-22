"use client";

import React, { useState } from "react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import { IGif } from "@giphy/js-types";

const GiphySearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || "");

  const fetchGifs = (offset: number) =>
    searchTerm
      ? gf.search(searchTerm, { offset, limit: 10 })
      : gf.trending({ offset, limit: 10 });

  return (
    <div className="p-4 text-center">
      <input
        type="text"
        placeholder="Search GIFs"
        value={searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSearchTerm(e.target.value)
        }
        className="w-full max-w-md p-2 mb-4 text-lg border border-gray-300 rounded"
      />
      <Grid
        width={800}
        columns={3}
        gutter={6}
        fetchGifs={fetchGifs}
        key={searchTerm}
        onGifClick={(
          gif: IGif,
          e: React.SyntheticEvent<HTMLElement, Event>
        ) => {
          e.preventDefault();
          window.alert(gif.images.original.url);
        }}
      />
    </div>
  );
};

export default GiphySearch;
