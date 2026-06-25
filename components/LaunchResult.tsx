"use client";

import { BASE_SEPOLIA } from "@/lib/b20";

export type LaunchOutcome = {
  stage: "creating" | "minting" | "done";
  tokenAddress?: string;
  createTxHash?: string;
  mintTxHash?: string;
  name?: string;
  symbol?: string;
};

export default function LaunchResult({ outcome }: { outcome: LaunchOutcome | null }) {
  if (!outcome) {
    return (
      <div className="rounded-xl border border-dashed border-line p-5 text-sm text-mute">
        Your launch result — token address, mint transaction, and explorer
        links — will appear here once you click{" "}
        <span className="text-paper">Launch B20 token</span>.
      </div>
    );
  }

  const explorerToken = outcome.tokenAddress
    ? `${BASE_SEPOLIA.explorer}/address/${outcome.tokenAddress}`
    : undefined;

  return (
    <div className="space-y-3 rounded-xl border border-good/40 bg-good/5 p-5">
      <span className="font-mono text-xs uppercase tracking-wider text-good">
        {outcome.stage === "done" ? "launched" : "in progress"}
      </span>

      {outcome.stage !== "done" && (
        <p className="text-sm text-paper">
          {outcome.stage === "creating"
            ? "Waiting for the createB20 transaction to confirm…"
            : "Token created — minting initial supply to your wallet…"}
        </p>
      )}

      {outcome.tokenAddress && (
        <Row label="Token address">
          <a
            href={explorerToken}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-mono text-sm text-baselight underline"
          >
            {outcome.tokenAddress}
          </a>
        </Row>
      )}

      {outcome.stage === "done" && (
        <p className="text-sm text-paper">
          {outcome.name} (${outcome.symbol}) is live on {BASE_SEPOLIA.name}. It
          behaves like a normal ERC-20 everywhere — wallets, explorers, DEX
          tooling — with no extra integration needed.
        </p>
      )}

      {outcome.createTxHash && (
        <Row label="Create tx">
          <ExplorerLink hash={outcome.createTxHash} />
        </Row>
      )}
      {outcome.mintTxHash && (
        <Row label="Mint tx">
          <ExplorerLink hash={outcome.mintTxHash} />
        </Row>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs text-mute">{label}</span>
      {children}
    </div>
  );
}

function ExplorerLink({ hash }: { hash: string }) {
  return (
    <a
      href={`${BASE_SEPOLIA.explorer}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all font-mono text-xs text-baselight underline"
    >
      {hash}
    </a>
  );
}
