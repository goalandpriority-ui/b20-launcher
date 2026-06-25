"use client";

import { BASE_SEPOLIA } from "@/lib/b20";

export default function FaucetCard({ address }: { address: string | null }) {
  const faucetUrl = address
    ? `${BASE_SEPOLIA.faucet}?address=${address}`
    : BASE_SEPOLIA.faucet;

  return (
    <div className="rounded-xl border border-line bg-panel/60 p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-forge">
          01 · fuel up
        </span>
      </div>
      <h3 className="font-display text-lg font-semibold text-paper">
        Need Base Sepolia ETH first
      </h3>
      <p className="mt-1.5 text-sm text-mute">
        Launching a token is one real transaction to the B20 Factory precompile.
        It needs gas — testnet ETH, never real funds. Most people stall here
        simply because their wallet is empty, so grab some before you touch
        the form below.
      </p>

      <a
        href={faucetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-forge px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110"
      >
        Open the Coinbase CDP Faucet →
      </a>

      <p className="mt-3 font-mono text-xs text-mute">
        RPC: {BASE_SEPOLIA.rpcUrl} · Chain ID: {BASE_SEPOLIA.chainId}
      </p>
    </div>
  );
}
