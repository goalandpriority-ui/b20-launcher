import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_URL || "https://your-app.vercel.app";

export async function GET() {
  return NextResponse.json({
    // Fill these three in after running `npx @farcaster/cli sign-manifest`
    // (or the Warpcast "generate domain manifest" tool) against your real
    // deployed domain. See README.md → "Publish to Farcaster".
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    miniapp: {
      version: "1",
      name: "B20 Forge",
      homeUrl: APP_URL,
      iconUrl: `${APP_URL}/icon.png`,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#0A0E14",
      subtitle: "Launch B20 tokens on Base Sepolia",
      description:
        "Forge a real B20 native token on Base Sepolia testnet in one transaction — no Solidity required.",
      primaryCategory: "developer-tools",
      tags: ["base", "b20", "testnet", "tokens", "developer-tools"],
      heroImageUrl: `${APP_URL}/embed-image.png`,
      tagline: "Forge a testnet token in one tap",
      ogTitle: "B20 Forge",
      ogDescription: "Launch a B20 native token on Base Sepolia testnet.",
      ogImageUrl: `${APP_URL}/embed-image.png`,
    },
  });
}
