"use client";

import { BASE_SEPOLIA } from "@/lib/b20";

export default function FaucetCard({ address }: { address: string | null }) {
  const faucetUrl = address
    ? `${BASE_SEPOLIA.faucet}?address=${address}`
    : BASE_SEPOLIA.faucet;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel/60 px-4 py-2.5">
      <p className="text-xs text-mute">
        Need testnet ETH? Launching costs real gas — testnet only.
      </p>
      <a
        href={faucetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 whitespace-nowrap rounded-md bg-forge px-3 py-1.5 text-xs font-semibold text-ink transition hover:brightness-110"
      >
        Get ETH →
      </a>
    </div>
  );
}
