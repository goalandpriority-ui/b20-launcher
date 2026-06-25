"use client";

import { useEffect } from "react";

export default function MiniAppBoot() {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        if (mounted) await sdk.actions.ready();
      } catch {
        // Not inside a Farcaster client — fine, this is also a normal website.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
