import { Metadata } from "next";
import Image from "next/image";
import App from "@/app/app";


const appUrl = process.env.NEXT_PUBLIC_URL;

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const frame = {
    version: "next",
    imageUrl: `${appUrl}/og.gif`,
    button: {
      title: "Open GIF Explorer",
      action: {
        type: "launch_frame",
        name: "GIF",
        url: `${appUrl}`,
        splashImageUrl: `${appUrl}/logo.png`,
        splashBackgroundColor: "#333333",
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
          url: `${appUrl}/og.gif`,
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
      <h1 className="mb-4"></h1>
      <Image width={120} height={32} src="/attribution.gif" alt="GIF Logo" className="absolute top-0 right-0" />
      <App />
    </div>
  );
}
