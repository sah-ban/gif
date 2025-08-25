"use client";

import React, { useState, useEffect } from "react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import { IGif } from "@giphy/js-types";
import sdk, { type Context } from "@farcaster/miniapp-sdk";
import { useSearchParams } from "next/navigation";
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import "react-farcaster-embed/dist/styles.css";
import axios from "axios";

export default function GiphySearch() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.MiniAppContext>();
  const [username, setUsername] = useState<string | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);

      sdk.actions.ready({});
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || "");

  const fetchGifs = (offset: number) =>
    searchTerm
      ? gf.search(searchTerm, { offset, limit: 10 })
      : gf.trending({ offset, limit: 10 });

  const searchParams = useSearchParams();
  const castHash = searchParams.get("castHash");
  const castFid = searchParams.get("castFid");

  useEffect(() => {
    if (castFid) {
      user(castFid);
    }
  }, [context, castFid]);

  const casting = async (url: string) => {
    if (castHash) {
      sdk.actions.openUrl(
        `https://farcaster.xyz/~/compose?embeds[]=${url}&parentCastHash=${castHash}`
      );
    } else {
      const hash = await cast(url);
      if (hash) {
        sdk.actions.close();
      }
    }
  };
  const cast = async (url: string): Promise<string | undefined> => {
    try {
      const result = await sdk.actions.composeCast({
        embeds: [`${url}`],
      });

      return result.cast?.hash;
    } catch (error) {
      console.error("Error composing cast:", error);
      return undefined;
    }
  };

  useEffect(() => {
    if (!context?.client.added) {
      sdk.actions.addFrame();
    }
  }, [context?.client.added]);

  const user = async (fid: string) => {
    const response = await axios.get(
      `https://api.farcaster.xyz/v2/user?fid=${fid}`
    );
    const username = response.data?.result?.user?.username;
    setUsername(username);
  };

  if (!context)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="flex flex-col items-center justify-center text-white text-2xl p-4">
          <p className="flex items-center justify-center text-center">
            You need to access this mini app from inside a farcaster client
          </p>
          <div
            className="flex items-center justify-center text-center bg-indigo-800 p-3 rounded-lg mt-4 cursor-pointer"
            onClick={() => window.open("https://farcaster.xyz/cashlessman.eth")}
          >
            Open in Farcaster
          </div>
        </div>
      </div>
    );

  return (
    <div className="">
      {castHash && username && (
        <div className="mb-4">
          <div className="text-white mb-4">
            Replying to @{username}
          </div>
          <div className="bg-[#192734] text-white rounded-2xl shadow-lg max-w-xl w-full border border-[#2F3336]">
            <FarcasterEmbed username={username} hash={castHash} />
          </div>
        </div>
      )}
      <div className="text-center">
        <input
          type="text"
          placeholder="Search GIFs"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
          className="w-full max-w-md p-2 mb-4 text-lg border border-gray-300 rounded text-white"
        />
        <Grid
          width={350}
          columns={3}
          gutter={6}
          fetchGifs={fetchGifs}
          key={searchTerm}
          onGifClick={(
            gif: IGif,
            e: React.SyntheticEvent<HTMLElement, Event>
          ) => {
            e.preventDefault();
            casting(gif.images.original.url);
          }}
        />
      </div>
    </div>
  );
}
