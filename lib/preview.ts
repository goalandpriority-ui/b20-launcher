/**
 * lib/preview.ts
 *
 * Base's factory derives every B20 token's address deterministically from
 * (variant, creator address, salt) — see IB20Factory.getB20Address. That
 * means we can show the user their exact future token address before they
 * ever sign anything, just by reading the public Base Sepolia RPC.
 */

import { Contract, JsonRpcProvider, keccak256, toUtf8Bytes } from "ethers";
import { B20_FACTORY_ABI, B20_FACTORY_ADDRESS, BASE_SEPOLIA, B20Variant } from "./b20";

let readProvider: JsonRpcProvider | null = null;

function getReadProvider(): JsonRpcProvider {
  if (!readProvider) {
    readProvider = new JsonRpcProvider(BASE_SEPOLIA.rpcUrl, BASE_SEPOLIA.chainId);
  }
  return readProvider;
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
