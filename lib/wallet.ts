/**
 * lib/wallet.ts
 *
 * Resolves an EIP-1193 provider:
 *  1. Inside a Farcaster client (Warpcast / Base App) — the Mini App SDK
 *     exposes the user's wallet at sdk.wallet.getEthereumProvider().
 *  2. In a normal browser tab — falls back to window.ethereum (MetaMask,
 *     Coinbase Wallet, Rabby, etc.) so the app is also testable outside
 *     Farcaster while you're building.
 */

import { BrowserProvider } from "ethers";
import { BASE_SEPOLIA } from "./b20";

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

let cachedRawProvider: Eip1193Provider | null = null;

export async function getRawProvider(): Promise<Eip1193Provider> {
  if (cachedRawProvider) return cachedRawProvider;

  // Try Farcaster Mini App wallet first.
  try {
    const { sdk } = await import("@farcaster/miniapp-sdk");
    const fcProvider = await sdk.wallet.getEthereumProvider();
    if (fcProvider) {
      cachedRawProvider = fcProvider as unknown as Eip1193Provider;
      return cachedRawProvider;
    }
  } catch {
    // Not running inside Farcaster, or SDK not ready — fall through.
  }

  // Fall back to an injected browser wallet.
  const injected = (globalThis as unknown as { ethereum?: Eip1193Provider }).ethereum;
  if (injected) {
    cachedRawProvider = injected;
    return cachedRawProvider;
  }

  throw new Error(
    "No wallet found. Open this app inside Farcaster, or install a browser wallet like MetaMask / Coinbase Wallet."
  );
}

export async function connectWallet(): Promise<{
  provider: BrowserProvider;
  address: string;
}> {
  const raw = await getRawProvider();
  const accounts = (await raw.request({ method: "eth_requestAccounts" })) as string[];
  const address = accounts[0];
  if (!address) throw new Error("Wallet returned no accounts.");

  await ensureBaseSepolia(raw);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = new BrowserProvider(raw as any);
  return { provider, address };
}

/** Returns a Signer for the already-connected wallet. Call connectWallet() first. */
export async function getSigner() {
  const raw = await getRawProvider();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = new BrowserProvider(raw as any);
  return provider.getSigner();
}

/** Prompts a chain switch / add if the wallet isn't already on Base Sepolia. */
export async function ensureBaseSepolia(raw: Eip1193Provider): Promise<void> {
  const currentChainId = (await raw.request({ method: "eth_chainId" })) as string;
  if (currentChainId?.toLowerCase() === BASE_SEPOLIA.chainIdHex) return;

  try {
    await raw.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_SEPOLIA.chainIdHex }],
    });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 4902) {
      await raw.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BASE_SEPOLIA.chainIdHex,
            chainName: BASE_SEPOLIA.name,
            nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: [BASE_SEPOLIA.rpcUrl],
            blockExplorerUrls: [BASE_SEPOLIA.explorer],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}
