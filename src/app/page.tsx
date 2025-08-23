import GiphySearch from "@/components/GiphySearch";
import { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_URL;

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const frame = {
    version: "next",
    imageUrl: `${appUrl}/logo.png`,
    button: {
      title: "Open GIF Search",
      action: {
        type: "launch_frame",
        name: "GIF",
        url: `${appUrl}`,
        splashImageUrl: `${appUrl}/logo.png`,
        splashBackgroundColor: "#FFFFFF",
      },
    },
  };

  return {
    title: "GIF Search",
    openGraph: {
      title: "GIF Search",
      description: "Search and share GIFs on Farcaster",
      images: [
        {
          url: `${appUrl}/og.png`,
          width: 1200,
          height: 630,
          alt: "GIF Search",
        },
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return (
    <div className="min-h-screen w-full p-4 text-center bg-slate-800">
      <h1 className="text-3xl font-bold mb-4 text-white">Gif</h1>
      <GiphySearch />
    </div>
  );
}
