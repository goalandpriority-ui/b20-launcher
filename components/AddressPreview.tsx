"use client";

import { useEffect, useState } from "react";
import { previewAddress, saltFromSeed } from "@/lib/preview";

export default function AddressPreview({
  sender,
  saltSeed,
}: {
  sender: string | null;
  saltSeed: string;
}) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sender) {
      setAddress(null);
      return;
    }
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const result = await previewAddress(sender, saltSeed);
      if (active) {
        setAddress(result);
        setLoading(false);
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [sender, saltSeed]);

  const salt = saltFromSeed(saltSeed);

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-ink p-5">
      <div className="bg-forge-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative">
        <span className="font-mono text-xs uppercase tracking-wider text-baselight">
          deterministic address
        </span>
        <p className="mt-2 break-all font-mono text-sm text-paper">
          {!sender
            ? "Connect a wallet to compute this — it's deterministic from (variant, your address, salt)."
            : loading
            ? "resolving on Base Sepolia…"
            : address
            ? address
            : "—"}
        </p>
        <p className="mt-3 font-mono text-[11px] text-mute">
          salt = keccak256(&quot;{saltSeed || "…"}&quot;) → {salt.slice(0, 18)}…
        </p>
        <p className="mt-2 text-xs text-mute">
          This is not a guess. The factory's <code>getB20Address</code> view
          function is called live against Base Sepolia, so the address shown
          is exactly where your token will live the moment you sign.
        </p>
      </div>
    </div>
  );
}
