"use client";

import { useState } from "react";
import WalletBar from "@/components/WalletBar";
import FaucetCard from "@/components/FaucetCard";
import TokenForm from "@/components/TokenForm";
import B20Explainer from "@/components/B20Explainer";

export default function Home() {
  const [address, setAddress] = useState<string | null>(null);
  const [tab, setTab] = useState<"forge" | "learn">("forge");

  return (
    <main className="bg-forge-grid min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-baselight">
            base sepolia · testnet only
          </span>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-paper sm:text-4xl">
            B20 Forge
          </h1>
        </header>

        <div className="mb-4">
          <WalletBar onConnected={setAddress} />
        </div>

        <div className="mb-4 flex gap-1 rounded-lg border border-line bg-panel/60 p-1">
          <TabButton active={tab === "forge"} onClick={() => setTab("forge")}>
            Forge
          </TabButton>
          <TabButton active={tab === "learn"} onClick={() => setTab("learn")}>
            What&apos;s B20?
          </TabButton>
        </div>

        {tab === "forge" ? (
          <div className="space-y-4">
            <FaucetCard address={address} />
            <TokenForm address={address} onAddressChange={setAddress} />
          </div>
        ) : (
          <B20Explainer />
        )}

        <footer className="mt-8 border-t border-line pt-5 text-xs text-mute">
          Built as a Farcaster Mini App. Testnet ETH has no value.
        </footer>
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
        active ? "bg-base text-white" : "text-mute hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}
