"use client";

import { useState } from "react";
import { connectWallet } from "@/lib/wallet";
import { BASE_SEPOLIA } from "@/lib/b20";

export default function WalletBar({
  onConnected,
}: {
  onConnected: (address: string) => void;
}) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const { address } = await connectWallet();
      setAddress(address);
      onConnected(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect wallet.");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-panel/80 px-4 py-3">
      <div className="flex items-center gap-2 font-mono text-xs text-mute">
        <span className="h-2 w-2 rounded-full bg-good pulse-dot" />
        {BASE_SEPOLIA.name} · chain {BASE_SEPOLIA.chainId}
      </div>

      {address ? (
        <span className="rounded-lg border border-line bg-ink px-3 py-1.5 font-mono text-sm text-paper">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      ) : (
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="rounded-lg bg-base px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-baselight disabled:opacity-60"
        >
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
      )}

      {error && <p className="w-full text-xs text-forge">{error}</p>}
    </div>
  );
}
