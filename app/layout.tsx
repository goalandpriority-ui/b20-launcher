import type { Metadata } from "next";
import "./globals.css";
import MiniAppBoot from "@/components/MiniAppBoot";

const APP_URL = process.env.NEXT_PUBLIC_URL || "https://your-app.vercel.app";

const miniAppEmbed = {
  version: "1",
  imageUrl: `${APP_URL}/embed-image.png`,
  button: {
    title: "Forge a B20 Token",
    action: {
      type: "launch_miniapp",
      name: "B20 Forge",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#0A0E14",
    },
  },
};

export const metadata: Metadata = {
  title: "B20 Forge — launch a token on Base Sepolia",
  description:
    "Create a real B20 native token on Base Sepolia testnet straight from a Farcaster Mini App. No contract to write, deploy, or audit.",
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
    "fc:frame": JSON.stringify(miniAppEmbed),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body bg-ink text-paper antialiased">
        <MiniAppBoot />
        {children}
      </body>
    </html>
  );
}
