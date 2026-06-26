"use client";

import { useMemo, useState } from "react";
import {
  buildAssetCreateTx,
  buildGrantRoleTx,
  buildUpdateSupplyCapTx,
  buildMintTx,
  B20_ROLES,
  MAX_ASSET_DECIMALS,
  MIN_ASSET_DECIMALS,
  BASE_SEPOLIA,
} from "@/lib/b20";
import { connectWallet, getSigner } from "@/lib/wallet";
import { waitForReceipt, previewAddress } from "@/lib/preview";
import AddressPreview from "@/components/AddressPreview";
import LaunchResult, { LaunchOutcome } from "@/components/LaunchResult";

const DECIMAL_OPTIONS = [6, 8, 9, 18];
const SUPPLY_OPTIONS = [
  { label: "1,000", value: "1000" },
  { label: "100,000", value: "100000" },
  { label: "1,000,000", value: "1000000" },
  { label: "10,000,000", value: "10000000" },
  { label: "100,000,000", value: "100000000" },
];
const CAP_MULTIPLIERS = [
  { label: "No cap", value: "none" },
  { label: "1× initial supply (fixed forever)", value: "1" },
  { label: "10× initial supply", value: "10" },
  { label: "100× initial supply", value: "100" },
];

function randomSeed() {
  return `b20-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export default function TokenForm({
  address,
  onAddressChange,
}: {
  address: string | null;
  onAddressChange: (address: string) => void;
}) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(18);
  const [customDecimals, setCustomDecimals] = useState(false);
  const [supply, setSupply] = useState("1000000");
  const [customSupply, setCustomSupply] = useState("");
  const [useCustomSupply, setUseCustomSupply] = useState(false);
  const [capChoice, setCapChoice] = useState("none");
  const [customCap, setCustomCap] = useState("");
  const [saltSeed, setSaltSeed] = useState(randomSeed());
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<LaunchOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveSupply = useCustomSupply ? customSupply : supply;

  const effectiveCap = useMemo(() => {
    if (capChoice === "none") return undefined;
    if (capChoice === "custom") return customCap;
    if (!effectiveSupply) return undefined;
    try {
      return (BigInt(effectiveSupply) * BigInt(capChoice)).toString();
    } catch {
      return undefined;
    }
  }, [capChoice, customCap, effectiveSupply]);

  const symbolClean = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);

  const formValid =
    name.trim().length > 0 &&
    symbolClean.length > 0 &&
    decimals >= MIN_ASSET_DECIMALS &&
    decimals <= MAX_ASSET_DECIMALS &&
    effectiveSupply.trim().length > 0 &&
    /^\d+$/.test(effectiveSupply.trim());

  async function handleLaunch() {
    setError(null);
    setOutcome(null);
    setSubmitting(true);
    try {
      let signerAddress = address;
      if (!signerAddress) {
        const conn = await connectWallet();
        signerAddress = conn.address;
        onAddressChange(signerAddress);
      }

      const { to, data, initialSupplyUnits, supplyCapUnits } = buildAssetCreateTx({
        name: name.trim(),
        symbol: symbolClean,
        decimals,
        admin: signerAddress!,
        initialSupply: effectiveSupply.trim(),
        supplyCap: effectiveCap,
        saltSeed,
      });

      const signer = await getSigner();

      setOutcome({ stage: "creating" });
      const createTx = await signer.sendTransaction({ to, data, gasLimit: 1_000_000n });
      const createReceipt = await waitForReceipt(createTx.hash);
      if (!createReceipt) throw new Error("Create transaction did not confirm.");
      if (createReceipt.status === 0) {
        throw new Error(
          `Create transaction reverted on-chain. Check the exact reason at ${BASE_SEPOLIA.explorer}/tx/${createTx.hash}`
        );
      }

      // The token's address is deterministic from (variant, sender, salt) —
      // no need to parse event logs (whose exact shape on a precompile we
      // can't fully verify). Just ask the factory directly, the same way
      // the live preview panel already does.
      const tokenAddress = await previewAddress(signerAddress!, saltSeed);
      if (!tokenAddress) {
        throw new Error(
          "Token created, but couldn't resolve its address. Check the create tx on the explorer."
        );
      }

      // Grant MINT_ROLE to the admin (separate tx, signed directly by the
      // admin — avoids the access-control ordering issue initCalls hit).
      setOutcome({ stage: "granting", tokenAddress, createTxHash: createTx.hash });
      const { to: grantTo, data: grantData } = buildGrantRoleTx(
        tokenAddress,
        B20_ROLES.MINT_ROLE,
        signerAddress!
      );
      const grantTx = await signer.sendTransaction({ to: grantTo, data: grantData, gasLimit: 150_000n });
      const grantReceipt = await waitForReceipt(grantTx.hash);
      if (grantReceipt.status === 0) {
        throw new Error(
          `Granting MINT_ROLE reverted. Check ${BASE_SEPOLIA.explorer}/tx/${grantTx.hash}`
        );
      }

      // Set the supply cap (always explicit — even "no cap" is the
      // documented uint128-max sentinel, not a default).
      setOutcome({ stage: "capping", tokenAddress, createTxHash: createTx.hash });
      const { to: capTo, data: capData } = buildUpdateSupplyCapTx(tokenAddress, supplyCapUnits);
      const capTx = await signer.sendTransaction({ to: capTo, data: capData, gasLimit: 150_000n });
      const capReceipt = await waitForReceipt(capTx.hash);
      if (capReceipt.status === 0) {
        throw new Error(
          `Setting the supply cap reverted. Check ${BASE_SEPOLIA.explorer}/tx/${capTx.hash}`
        );
      }

      let mintHash: string | undefined;
      if (BigInt(initialSupplyUnits) > BigInt(0)) {
        setOutcome({ stage: "minting", tokenAddress, createTxHash: createTx.hash });
        const { to: mintTo, data: mintData } = buildMintTx(
          tokenAddress,
          signerAddress!,
          initialSupplyUnits
        );
        const mintTx = await signer.sendTransaction({ to: mintTo, data: mintData, gasLimit: 200_000n });
        const mintReceipt = await waitForReceipt(mintTx.hash);
        if (mintReceipt.status === 0) {
          throw new Error(`Mint reverted. Check ${BASE_SEPOLIA.explorer}/tx/${mintTx.hash}`);
        }
        mintHash = mintTx.hash;
      }

      setOutcome({
        stage: "done",
        tokenAddress,
        createTxHash: createTx.hash,
        mintTxHash: mintHash,
        name: name.trim(),
        symbol: symbolClean,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Launch failed.";
      setError(message.length > 220 ? message.slice(0, 220) + "…" : message);
      setOutcome(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-xl border border-line bg-panel/60 p-4 sm:p-6">
        <h3 className="font-display text-base font-semibold text-paper sm:text-lg">
          Token parameters
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Token name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Testnet Token"
              maxLength={40}
              className={inputClass}
            />
          </Field>
          <Field label="Symbol (auto uppercase)">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="MYT"
              maxLength={11}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Decimals — fixed at creation, must be 6–18">
          <div className="flex flex-wrap gap-2">
            {DECIMAL_OPTIONS.map((d) => (
              <PillButton
                key={d}
                active={!customDecimals && decimals === d}
                onClick={() => {
                  setCustomDecimals(false);
                  setDecimals(d);
                }}
              >
                {d}
              </PillButton>
            ))}
            <PillButton active={customDecimals} onClick={() => setCustomDecimals(true)}>
              Custom
            </PillButton>
          </div>
          {customDecimals && (
            <input
              type="number"
              min={MIN_ASSET_DECIMALS}
              max={MAX_ASSET_DECIMALS}
              value={decimals}
              onChange={(e) => setDecimals(Number(e.target.value))}
              className={`${inputClass} mt-2 w-28`}
            />
          )}
        </Field>

        <Field label="Initial supply (minted to your wallet on launch)">
          <div className="flex flex-wrap gap-2">
            {SUPPLY_OPTIONS.map((opt) => (
              <PillButton
                key={opt.value}
                active={!useCustomSupply && supply === opt.value}
                onClick={() => {
                  setUseCustomSupply(false);
                  setSupply(opt.value);
                }}
              >
                {opt.label}
              </PillButton>
            ))}
            <PillButton active={useCustomSupply} onClick={() => setUseCustomSupply(true)}>
              Custom
            </PillButton>
          </div>
          {useCustomSupply && (
            <input
              value={customSupply}
              onChange={(e) => setCustomSupply(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="e.g. 42000000"
              className={`${inputClass} mt-2`}
            />
          )}
        </Field>

        <Field label="Supply cap — the hard ceiling totalSupply can ever reach">
          <div className="flex flex-wrap gap-2">
            {CAP_MULTIPLIERS.map((opt) => (
              <PillButton
                key={opt.value}
                active={capChoice === opt.value}
                onClick={() => setCapChoice(opt.value)}
              >
                {opt.label}
              </PillButton>
            ))}
            <PillButton active={capChoice === "custom"} onClick={() => setCapChoice("custom")}>
              Custom
            </PillButton>
          </div>
          {capChoice === "custom" && (
            <input
              value={customCap}
              onChange={(e) => setCustomCap(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="exact cap, in whole tokens"
              className={`${inputClass} mt-2`}
            />
          )}
        </Field>

        <details className="rounded-lg border border-line bg-ink/60 p-3 text-xs text-mute">
          <summary className="cursor-pointer select-none font-mono uppercase tracking-wide text-baselight">
            advanced: salt
          </summary>
          <p className="mt-2">
            The salt fixes your token&apos;s deterministic address. Reusing a
            salt you&apos;ve already used from this wallet reverts with{" "}
            <code>TokenAlreadyExists</code>.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={saltSeed}
              onChange={(e) => setSaltSeed(e.target.value)}
              className={`${inputClass} font-mono text-xs`}
            />
            <button
              type="button"
              onClick={() => setSaltSeed(randomSeed())}
              className="rounded-lg border border-line px-3 py-2 text-xs text-paper hover:border-baselight"
            >
              Shuffle
            </button>
          </div>
        </details>

        <button
          onClick={handleLaunch}
          disabled={!formValid || submitting}
          className="w-full rounded-lg bg-base px-5 py-3 font-display text-sm font-semibold text-white transition hover:bg-baselight disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Forging on Base Sepolia…" : "Launch B20 token"}
        </button>
        {error && <p className="text-sm text-forge">{error}</p>}
        <p className="text-xs text-mute">
          Up to four signatures: create the token, grant yourself mint
          rights, set the supply cap, then mint the initial supply. All on{" "}
          {BASE_SEPOLIA.name} — testnet ETH only.
        </p>
      </div>

      <div className="space-y-5">
        <AddressPreview sender={address} saltSeed={saltSeed} />
        <LaunchResult outcome={outcome} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-mute">{label}</span>
      {children}
    </label>
  );
}

function PillButton({
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
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-base bg-base/20 text-baselight"
          : "border-line text-mute hover:border-baselight hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}

const inputClass =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-mute/60 focus:border-baselight";
