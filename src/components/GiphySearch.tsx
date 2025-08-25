"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import { IGif } from "@giphy/js-types";
import sdk, { type Context } from "@farcaster/miniapp-sdk";
import { useSearchParams } from "next/navigation";
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import "react-farcaster-embed/dist/styles.css";

export default function GiphySearch() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.MiniAppContext>();
  const [showPopup, setShowPopup] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

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

  const casting = async (url: string) => {
    if (castHash && selected === "Replying to") {
      sdk.actions.openUrl(
        `https://farcaster.xyz/~/compose?embeds[]=${url}&parentCastHash=${castHash}`
      );
    } else if (castHash && selected === "Quote Casting") {
      const hash = await quote(url, castHash.slice(0, 10));
      if (hash) {
        sdk.actions.close();
      }
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
        embeds: [url],
      });

    return result.cast?.hash;
  } catch (error) {
    console.error("Error composing cast:", error);
    return undefined;
  }
};

  const quote = async (url: string, hash: string): Promise<string | undefined> => {
    try {
      const result = await sdk.actions.composeCast({
        embeds: [url, `https://farcaster.xyz/${profileData?.username}/${hash}`],
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

  interface ProfileResponse {
    username: string;
  }
  const [profileData, setProfileData] = useState<ProfileResponse>();

  const fetchProfile = useCallback(async (fid: string) => {
    try {
      const profileResponse = await fetch(`/api/profile?fid=${fid}`);
      if (!profileResponse.ok) {
        throw new Error(`Fid HTTP error! Status: ${profileResponse.status}`);
      }
      const profileResponseData = await profileResponse.json();
      setProfileData({
        username: profileResponseData.username,
      });
    } catch (err) {
      console.error("Error fetching profile data", err);
    }
  }, []);

  useEffect(() => {
    if (castFid) {
      fetchProfile(castFid);
      setShowPopup(true);
    }
  }, [context]);

  // if (!context)
  //   return (
  //     <div className="flex items-center justify-center h-screen bg-gray-900">
  //       <div className="flex flex-col items-center justify-center text-white text-2xl p-4">
  //         <p className="flex items-center justify-center text-center">
  //           You need to access this mini app from inside a farcaster client
  //         </p>
  //         <div
  //           className="flex items-center justify-center text-center bg-indigo-800 p-3 rounded-lg mt-4 cursor-pointer"
  //           onClick={() => window.open("https://farcaster.xyz/cashlessman.eth")}
  //         >
  //           Open in Farcaster
  //         </div>
  //       </div>
  //     </div>
  //   );

  return (
    <div className="">
      <QuoteOrReply />
      {castHash && profileData?.username && (
        <div className="mb-4">
          <div className="text-white mb-4">
            {selected} @{profileData?.username}
          </div>
          <div className="bg-[#16101e] text-white rounded-2xl shadow-lg max-w-xl w-full border border-[#2F3336]">
            <FarcasterEmbed username={profileData?.username} hash={castHash} />
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

  function QuoteOrReply() {
    const handleSelect = (choice: string) => {
      setSelected(choice);
      setShowPopup(false);
    };
    return (
      <div className="text-white">
        {showPopup && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6 w-[90%] max-w-sm text-white relative backdrop-blur-xl">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleSelect("Quote Casting")}
                  className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
                >
                  <span className="text-4xl">&ldquo;</span>
                  <span className="text-lg">Quote Cast</span>
                </button>

                <button
                  onClick={() => handleSelect("Replying to")}
                  className="bg-green-500 px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                    />
                  </svg>

                  <span className="text-lg">Reply</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
