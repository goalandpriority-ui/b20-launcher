import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_URL || "https://your-app.vercel.app";

export async function GET() {
  return NextResponse.json({
    accountAssociation: {
      header: "eyJmaWQiOjIzODAwNiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGVmOTAzMTEwMTRBMWE3ZmY4MDMwNzlmQTVlOGIxMmQ3MjhGNjY0RUUifQ",
      payload: "eyJkb21haW4iOiJiMjAtbGF1bmNoZXIudmVyY2VsLmFwcCJ9",
      signature: "wrv05FqqWhdMnBLfak5DGmOUJdqXkr+1/Ji0d0a2tqdxgszPxT0jfjo3GWF3WkfEwy9gqHZBfiXhDECzcQhRVxw=",
    },
    miniapp: {
      version: "1",
      name: "B20 Forge",
      homeUrl: APP_URL,
      iconUrl: `${APP_URL}/icon.png`,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#0A0E14",
      subtitle: "Launch tokens on Base Sepolia",
      description:
        "Forge a real B20 native token on Base Sepolia testnet in one transaction — no Solidity required.",
      primaryCategory: "developer-tools",
      tags: ["base", "b20", "testnet", "tokens", "developer-tools"],
      heroImageUrl: `${APP_URL}/embed-image.png`,
      tagline: "Forge a token in one tap",
      ogTitle: "B20 Forge",
      ogDescription: "Launch a B20 native token on Base Sepolia testnet.",
      ogImageUrl: `${APP_URL}/embed-image.png`,
    },
  });
}
