"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import sdk, { type Context } from "@farcaster/miniapp-sdk";
import { useSearchParams } from "next/navigation";
import { FarcasterEmbed } from "react-farcaster-embed/dist/client";
import "react-farcaster-embed/dist/styles.css";
import Masonry from "react-masonry-css";
import CheckInComponent from "@/components/wallet";
import Connect from "./Connect";
import { useAccount } from "wagmi";
import { blocked } from "./blocked";

interface TenorGif {
  id: string;
  media_formats: {
    tinygif: { url: string; dims: [number, number] };
    gif: { url: string };
  };
}

export default function GiphySearch() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.MiniAppContext>();
  const [showPopup, setShowPopup] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const { isConnected } = useAccount();

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
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [nextPos, setNextPos] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const key = process.env.NEXT_PUBLIC_TENOR_API_KEY?.trim() || "";
  console.log("Tenor API Key Length:", key.length);

  const fetchGifs = useCallback(
    async (query: string, pos: string | null) => {
      if (!key) {
        setError("Tenor API key is missing");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const url = query
          ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
              query
            )}&key=${key}&pos=${pos || ""}&limit=20`
          : `https://tenor.googleapis.com/v2/featured?key=${key}&pos=${
              pos || ""
            }&limit=20`;
        const response = await axios.get(url);
        const data = response.data;
        console.log(
          "Fetched Tenor GIFs:",
          data.results.length,
          "Next:",
          data.next
        );

        setGifs((prev) => {
          const existingIds = new Set(prev.map((gif) => gif.id));
          const newGifs = data.results.filter(
            (gif: TenorGif) => !existingIds.has(gif.id)
          );
          return pos ? [...prev, ...newGifs] : newGifs;
        });
        setNextPos(data.next || null);
      } catch (err) {
        console.error("Tenor API Error:", err);
        setError("Failed to fetch GIFs");
      } finally {
        setLoading(false);
      }
    },
    [key]
  );

  useEffect(() => {
    setGifs([]);
    setNextPos(null);
    fetchGifs(searchTerm, null);
  }, [searchTerm, fetchGifs]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextPos && !loading) {
          fetchGifs(searchTerm, nextPos);
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.current.observe(loadMoreRef.current);
    return () => observer.current?.disconnect();
  }, [nextPos, loading, searchTerm, fetchGifs]);

  const searchParams = useSearchParams();
  const castHash = searchParams.get("castHash");
  const castFid = searchParams.get("castFid");

  const casting = async (url: string) => {
    if (castHash && selected === "Replying to") {
      reply(url, castHash);
    } else if (castHash && selected === "Quote Casting") {
      quote(url, castHash.slice(0, 10));
    } else {
      cast(url);
    }
  };
  const cast = async (url: string) => {
    try {
      await sdk.actions.composeCast({
        embeds: [url],
        close: true,
      });
    } catch (error) {
      console.error("Error composing cast:", error);
      return undefined;
    }
  };

  const quote = async (url: string, hash: string) => {
    try {
      await sdk.actions.composeCast({
        embeds: [url, `https://farcaster.xyz/${profileData?.username}/${hash}`],
        close: true,
      });
    } catch (error) {
      console.error("Error composing cast:", error);
      return undefined;
    }
  };
  const reply = async (url: string, hash: string) => {
    try {
      await sdk.actions.composeCast({
        embeds: [url],
        parent: { type: "cast", hash },
        close: true,
      });
    } catch (error) {
      console.error("Error composing cast:", error);
    }
  };

  const share = async () => {
    try {
      await sdk.actions.composeCast({
        text: "Quote, reply & cast with a GIF with this miniapp by @cashlessman.eth",
        embeds: [`${process.env.NEXT_PUBLIC_URL}`],
        close: true,
      });
    } catch (error) {
      console.error("Error composing cast:", error);
    }
  };

  useEffect(() => {
    if (context?.client.clientFid === 9152 && !context?.client.added) {
      sdk.actions.addFrame();
    }
  }, [context?.client.added, context?.client.clientFid]);

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
  }, [context, castFid, fetchProfile]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);
  const longPressTime = 1200;

  if (!context)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="flex flex-col items-center justify-center text-white text-2xl p-4">
          <p className="flex items-center justify-center text-center">
            You need to access this mini app from inside a farcaster client
          </p>
          <div
            className="flex items-center justify-center text-center bg-indigo-800 p-3 rounded-lg mt-4 cursor-pointer"
            onClick={() =>
              window.open(
                "https://farcaster.xyz/miniapps/8vm2jc2faIFU/gif",
                "_blank"
              )
            }
          >
            Open in Farcaster
          </div>
        </div>
      </div>
    );

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Connect />
      </div>
    );
  }
  return (
    <div className="">
      <header>
        <div className="flex flex-row justify-between pt-2 px-3">
          <button
            onClick={share}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition cursor-pointer font-semibold"
          >
            Share Miniapp
          </button>
          <button
            onClick={() =>
              sdk.actions.viewCast({
                hash: "0xc000a48e2836034ad4338e825a33809cdd487b53",
              })
            }
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition cursor-pointer "
          >
            how to reply/quote cast
          </button>
        </div>
        {context?.client.clientFid === 9152 &&
          !blocked.includes(context?.user.fid) && <CheckInComponent />}
      </header>
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
      <input
        type="text"
        placeholder="Search Tenor"
        value={searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setSearchTerm(e.target.value)
        }
        className="w-9/10 p-2 mb-3 mt-2 text-lg border border-gray-300 rounded text-white bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mx-auto block"
      />
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <Masonry
        breakpointCols={3}
        className="flex gap-1 max-w-[320px] mx-auto"
        columnClassName="flex flex-col gap-1"
      >
        {gifs.length > 0
          ? gifs.map((gif, index) => (
              <div
                key={`${gif.id}-${index}`} // Unique key
                className="relative w-full rounded overflow-hidden"
                style={{
                  width:
                    gif.media_formats.tinygif.dims[0] > 200 ? "100%" : "auto", // Adjust width based on image
                }}
              >
                <Image
                  src={gif.media_formats.tinygif.url} // Use tinygif for faster loading
                  alt="Tenor GIF"
                  width={gif.media_formats.tinygif.dims[0]} // Tenor-provided width
                  height={gif.media_formats.tinygif.dims[1]} // Tenor-provided height
                  className="w-full h-auto cursor-pointer hover:scale-105 transition-transform"
                  unoptimized // No external optimization for Tenor CDN
                  priority={index < 2} // Prioritize first 2 for mobile LCP
                  onClick={() => casting(gif.media_formats.gif.url)} // Use full-sized gif for cast
                  onMouseDown={() => {
                    longPressTriggered.current = false;
                    timerRef.current = setTimeout(async () => {
                      longPressTriggered.current = true;
                      await navigator.clipboard.writeText(
                        gif.media_formats.gif.url
                      );
                      sdk.actions.close();
                    }, longPressTime);
                  }}
                  onMouseUp={() => {
                    if (timerRef.current) clearTimeout(timerRef.current);
                  }}
                  onMouseLeave={() =>
                    timerRef.current && clearTimeout(timerRef.current)
                  }
                  onTouchStart={() => {
                    longPressTriggered.current = false;
                    timerRef.current = setTimeout(async () => {
                      longPressTriggered.current = true;
                      await navigator.clipboard.writeText(
                        gif.media_formats.gif.url
                      );
                      sdk.actions.close();
                    }, longPressTime);
                  }}
                  onTouchEnd={() => {
                    if (timerRef.current) clearTimeout(timerRef.current);
                  }}
                />
              </div>
            ))
          : !loading && <p className="text-gray-500 text-sm">No GIFs found</p>}
      </Masonry>
      {loading && (
        <div className="mt-4 flex justify-center">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}
      {nextPos && <div ref={loadMoreRef} className="h-10"></div>}
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
