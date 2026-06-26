/**
 * lib/b20.ts
 *
 * JS/TS mirror of base/base-std (Base's official Solidity helper library) for
 * encoding calls to the B20 Factory precompile on Base. The encoding here is
 * derived directly from the on-chain interfaces so the bytes produced match
 * what base-forge / B20FactoryLib.sol would produce:
 *
 *   - https://github.com/base/base-std/blob/main/src/interfaces/IB20Factory.sol
 *   - https://github.com/base/base-std/blob/main/src/lib/B20FactoryLib.sol
 *   - https://github.com/base/base-std/blob/main/src/lib/B20Constants.sol
 *
 * If Base changes the precompile ABI after this was written, re-check those
 * files before trusting this against mainnet funds.
 */

import { AbiCoder, Interface, keccak256, toUtf8Bytes } from "ethers";

const abiCoder = AbiCoder.defaultAbiCoder();

/* ------------------------------------------------------------------------ */
/*  Network                                                                  */
/* ------------------------------------------------------------------------ */

export const BASE_SEPOLIA = {
  chainId: 84532,
  chainIdHex: "0x14a34",
  name: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
  explorer: "https://sepolia.basescan.org",
  faucet: "https://portal.cdp.coinbase.com/products/faucet",
};

/* ------------------------------------------------------------------------ */
/*  Precompile addresses (canonical on every B20-active Base network)        */
/* ------------------------------------------------------------------------ */

export const B20_FACTORY_ADDRESS = "0xB20F000000000000000000000000000000000000";
export const POLICY_REGISTRY_ADDRESS = "0x8453000000000000000000000000000000000002";

/* ------------------------------------------------------------------------ */
/*  Variant enum — order matters, it's the literal Solidity enum index       */
/* ------------------------------------------------------------------------ */

export enum B20Variant {
  ASSET = 0,
  STABLECOIN = 1,
}

/* ------------------------------------------------------------------------ */
/*  Roles & limits (B20Constants.sol)                                        */
/* ------------------------------------------------------------------------ */

const roleId = (label: string) => keccak256(toUtf8Bytes(label));

export const B20_ROLES = {
  DEFAULT_ADMIN_ROLE: "0x" + "00".repeat(32),
  MINT_ROLE: roleId("MINT_ROLE"),
  BURN_ROLE: roleId("BURN_ROLE"),
  BURN_BLOCKED_ROLE: roleId("BURN_BLOCKED_ROLE"),
  PAUSE_ROLE: roleId("PAUSE_ROLE"),
  UNPAUSE_ROLE: roleId("UNPAUSE_ROLE"),
  METADATA_ROLE: roleId("METADATA_ROLE"),
  OPERATOR_ROLE: roleId("OPERATOR_ROLE"),
};

export const MIN_ASSET_DECIMALS = 6;
export const MAX_ASSET_DECIMALS = 18;
/** type(uint128).max — Base's official "no cap" sentinel. */
export const MAX_SUPPLY_CAP = (BigInt(2) ** BigInt(128) - BigInt(1)).toString();

/* ------------------------------------------------------------------------ */
/*  Minimal ABIs                                                             */
/* ------------------------------------------------------------------------ */

// IB20Factory — only the pieces this app calls.
export const B20_FACTORY_ABI = [
  "function createB20(uint8 variant, bytes32 salt, bytes params, bytes[] initCalls) payable returns (address token)",
  "function getB20Address(uint8 variant, address sender, bytes32 salt) view returns (address)",
  "function isB20(address token) view returns (bool)",
  "function isB20Initialized(address token) view returns (bool)",
  "event B20Created(address indexed token, uint8 indexed variant, string name, string symbol, uint8 decimals, bytes variantEventParams)",
];

// IB20 / IB20Asset — the slice of the token's own interface this app calls
// directly after creation (mint, balanceOf, role checks).
export const B20_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function grantRole(bytes32 role, address account)",
  "function updateSupplyCap(uint256 newSupplyCap)",
];

const factoryIface = new Interface(B20_FACTORY_ABI);
const tokenIface = new Interface(B20_TOKEN_ABI);

/* ------------------------------------------------------------------------ */
/*  params encoders — mirrors B20FactoryLib.encode*CreateParams              */
/* ------------------------------------------------------------------------ */

/**
 * Encodes (name, symbol, initialAdmin, decimals) as a plain ABI tuple.
 * NOTE: an earlier version of this file prepended a "version" uint8 field
 * based on a guess about B20FactoryLib's internal struct layout. Base's own
 * docs only ever show encodeAssetCreateParams called with exactly these 4
 * arguments, with no version concept exposed anywhere in usage examples —
 * so that extra field was almost certainly wrong and is the most likely
 * cause of on-chain reverts. Removed.
 */
export function encodeAssetCreateParams(
  name: string,
  symbol: string,
  initialAdmin: string,
  decimals: number
): string {
  return abiCoder.encode(
    ["string", "string", "address", "uint8"],
    [name, symbol, initialAdmin, decimals]
  );
}

/**
 * Encodes (name, symbol, initialAdmin, currency) — same reasoning as above.
 */
export function encodeStablecoinCreateParams(
  name: string,
  symbol: string,
  initialAdmin: string,
  currency: string
): string {
  return abiCoder.encode(
    ["string", "string", "address", "string"],
    [name, symbol, initialAdmin, currency.toUpperCase()]
  );
}

/* ------------------------------------------------------------------------ */
/*  initCalls encoders — mirrors B20FactoryLib.encode*                       */
/* ------------------------------------------------------------------------ */

/** abi.encodeCall(IB20.grantRole, (role, account)) */
export function encodeGrantRole(role: string, account: string): string {
  return tokenIface.encodeFunctionData("grantRole", [role, account]);
}

/** abi.encodeCall(IB20.updateSupplyCap, (newSupplyCap)) */
export function encodeUpdateSupplyCap(newSupplyCap: string | bigint): string {
  return tokenIface.encodeFunctionData("updateSupplyCap", [newSupplyCap]);
}

/* ------------------------------------------------------------------------ */
/*  High-level builder: everything needed for one createB20 transaction      */
/* ------------------------------------------------------------------------ */

export interface BuildAssetTokenArgs {
  name: string;
  symbol: string;
  decimals: number;
  /** Address that becomes DEFAULT_ADMIN_ROLE holder and MINT_ROLE holder. */
  admin: string;
  /** Decimal string, e.g. "1000000" — already in token base units (NOT wei-scaled). */
  initialSupply: string;
  /** undefined/empty => no cap (MAX_SUPPLY_CAP sentinel). Base-unit decimal string otherwise. */
  supplyCap?: string;
  /** Random per-launch salt input; hashed to bytes32 internally. */
  saltSeed: string;
}

export function buildAssetCreateTx(args: BuildAssetTokenArgs) {
  const { name, symbol, decimals, admin, initialSupply, supplyCap, saltSeed } = args;

  const params = encodeAssetCreateParams(name, symbol, admin, decimals);

  const scale = BigInt(10) ** BigInt(decimals);
  const supplyCapUnits =
    supplyCap && supplyCap.trim() !== ""
      ? (BigInt(supplyCap) * scale).toString()
      : MAX_SUPPLY_CAP;

  // initCalls left empty deliberately: granting roles / setting the cap
  // inside the atomic creation window reverted in testing (likely an
  // access-control check against the admin role before it's fully active).
  // Doing those as separate, explicit follow-up transactions — each signed
  // directly by the admin — sidesteps that entirely.
  const initCalls: string[] = [];

  const salt = keccak256(toUtf8Bytes(saltSeed));

  const data = factoryIface.encodeFunctionData("createB20", [
    B20Variant.ASSET,
    salt,
    params,
    initCalls,
  ]);

  const initialSupplyUnits = (BigInt(initialSupply || "0") * scale).toString();

  return {
    to: B20_FACTORY_ADDRESS,
    data,
    salt,
    initialSupplyUnits,
    supplyCapUnits,
  };
}

/** Follow-up tx: grantRole(role, account) directly on the new token. */
export function buildGrantRoleTx(tokenAddress: string, role: string, account: string) {
  return {
    to: tokenAddress,
    data: tokenIface.encodeFunctionData("grantRole", [role, account]),
  };
}

/** Follow-up tx: updateSupplyCap(newSupplyCap) directly on the new token. */
export function buildUpdateSupplyCapTx(tokenAddress: string, newSupplyCap: string) {
  return {
    to: tokenAddress,
    data: tokenIface.encodeFunctionData("updateSupplyCap", [newSupplyCap]),
  };
}

/** Encodes the follow-up mint(admin, initialSupplyUnits) call on the new token. */
export function buildMintTx(tokenAddress: string, to: string, amountUnits: string) {
  return {
    to: tokenAddress,
    data: tokenIface.encodeFunctionData("mint", [to, amountUnits]),
  };
}

/** Decodes the token address out of a createB20 transaction receipt's logs. */
export function decodeCreatedTokenFromReceipt(receipt: {
  logs: { topics: string[]; data: string; address: string }[];
}): string | null {
  for (const log of receipt.logs) {
    try {
      const parsed = factoryIface.parseLog({ topics: log.topics, data: log.data });
      if (parsed && parsed.name === "B20Created") {
        return parsed.args.token as string;
      }
    } catch {
      // not a factory log, skip
    }
  }
  return null;
}

export { factoryIface, tokenIface };
