/**
 * lib/preview.ts
 *
 * Base's factory derives every B20 token's address deterministically from
 * (variant, creator address, salt) — see IB20Factory.getB20Address. That
 * means we can show the user their exact future token address before they
 * ever sign anything, just by reading the public Base Sepolia RPC.
 */

import { Contract, JsonRpcProvider, TransactionReceipt, keccak256, toUtf8Bytes } from "ethers";
import { B20_FACTORY_ABI, B20_FACTORY_ADDRESS, BASE_SEPOLIA, B20Variant } from "./b20";

let readProvider: JsonRpcProvider | null = null;

export function getReadProvider(): JsonRpcProvider {
  if (!readProvider) {
    readProvider = new JsonRpcProvider(BASE_SEPOLIA.rpcUrl, BASE_SEPOLIA.chainId);
  }
  return readProvider;
}

/**
 * Many wallet providers (Farcaster's in-app wallet included) only implement
 * the methods needed to sign and broadcast — not arbitrary reads like
 * eth_getTransactionReceipt. ethers' tx.wait() calls that read against
 * whichever provider sent the tx, so against those wallets it throws
 * "provider does not support the requested method" even though the
 * transaction itself went through fine. Polling our own public RPC instead
 * sidesteps that entirely.
 */
export async function waitForReceipt(
  hash: string,
  timeoutMs = 120_000
): Promise<TransactionReceipt> {
  const provider = getReadProvider();
  const receipt = await provider.waitForTransaction(hash, 1, timeoutMs);
  if (!receipt) throw new Error("Transaction did not confirm in time.");
  return receipt;
}

export function saltFromSeed(seed: string): string {
  return keccak256(toUtf8Bytes(seed));
}

export async function previewAddress(
  sender: string,
  saltSeed: string,
  variant: B20Variant = B20Variant.ASSET
): Promise<string | null> {
  if (!sender || sender.length !== 42) return null;
  try {
    const contract = new Contract(B20_FACTORY_ADDRESS, B20_FACTORY_ABI, getReadProvider());
    const salt = saltFromSeed(saltSeed);
    const address = await contract.getB20Address(variant, sender, salt);
    return address as string;
  } catch {
    return null;
  }
}
