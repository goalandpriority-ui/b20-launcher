"use client";

import { useState } from "react";
import WalletBar from "@/components/WalletBar";
import FaucetCard from "@/components/FaucetCard";
import TokenForm from "@/components/TokenForm";
import B20Explainer from "@/components/B20Explainer";

export default function Home() {
  const [address, setAddress] = useState<string | null>(null);

  return (
    <main className="bg-forge-grid min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <span className="font-mono text-xs uppercase tracking-wider text-baselight">
            base sepolia · testnet only
          </span>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-paper sm:text-4xl">
            B20 Forge
          </h1>
          <p className="mt-3 max-w-xl text-sm text-mute">
            Create a real, native B20 token on Base Sepolia in one
            transaction — no Solidity, no deployment, no audit. Anyone can
            launch as many as they want; it&apos;s testnet.
          </p>
        </header>

        <div className="mb-6">
          <WalletBar onConnected={setAddress} />
        </div>

        <div className="mb-8">
          <FaucetCard address={address} />
        </div>

        <div className="mb-10">
          <TokenForm address={address} onAddressChange={setAddress} />
        </div>

        <B20Explainer />

        <footer className="mt-10 border-t border-line pt-6 text-xs text-mute">
          Built as a Farcaster Mini App. Testnet ETH has no value — this is a
          sandbox for learning the B20 standard, not a place to deploy real
          assets.
        </footer>
      </div>
    </main>
  );
}
