export default function B20Explainer() {
  return (
    <div className="space-y-8 rounded-xl border border-line bg-panel/40 p-6 sm:p-8">
      <div>
        <span className="font-mono text-xs uppercase tracking-wider text-forge">
          03 · reference
        </span>
        <h2 className="mt-1 font-display text-2xl font-bold text-paper">
          What B20 actually is
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-mute">
          Everything below is drawn from Base&apos;s own documentation and the
          Beryl upgrade announcement, so you know exactly what you&apos;re
          deploying — not marketing copy.
        </p>
      </div>

      <Section title="The short version">
        <p>
          B20 is Base&apos;s native token standard, shipped as part of the{" "}
          <strong className="text-paper">Beryl</strong> network upgrade. Instead
          of a token being a smart contract you write, compile, deploy, and
          audit, a B20 token is a <strong className="text-paper">precompile</strong>{" "}
          — token logic written in Rust and executed directly inside Base&apos;s
          node software, the same tier as <code>ecrecover</code> or other
          built-in EVM opcodes. You never write or deploy a contract; you make
          one call to a singleton factory and the chain hands back a fully
          configured token.
        </p>
      </Section>

      <Section title="Why a precompile instead of a contract">
        <p>
          A normal ERC-20 means every project re-implements (and re-audits)
          the same access control, pausing, and transfer-restriction logic.
          B20 moves that logic into the protocol once, audited once by Base
          and the security firm Spearbit, so every issuer inherits it for
          free. The practical payoff: native execution is cheaper and
          higher-throughput than the equivalent Solidity contract, while
          staying a strict ERC-20 superset — <code>transfer</code>,{" "}
          <code>approve</code>, <code>balanceOf</code>, and friends all behave
          exactly as wallets and explorers already expect.
        </p>
      </Section>

      <Section title="Two variants">
        <div className="grid gap-4 sm:grid-cols-2">
          <VariantCard
            name="Asset"
            blurb="General-purpose issuance. Configurable decimals (6–18), rebasing/multiplier support, on-chain metadata, batched mint/clawback."
          />
          <VariantCard
            name="Stablecoin"
            blurb="Built for fiat-backed assets. Fixed 6 decimals and an immutable, issuer-declared ISO currency code (e.g. USD)."
          />
        </div>
        <p>
          This app forges <strong className="text-paper">Asset</strong>{" "}
          tokens — the variant most people mean by &quot;launch my own
          token.&quot;
        </p>
      </Section>

      <Section title="The Issuer Toolkit">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-paper">Role-based access control</strong> —
            separate <code>MINT_ROLE</code>, <code>BURN_ROLE</code>,{" "}
            <code>PAUSE_ROLE</code>, <code>METADATA_ROLE</code>, and more, each
            grantable independently.
          </li>
          <li>
            <strong className="text-paper">Supply caps</strong> — an optional
            ceiling on <code>totalSupply</code>; the &quot;no cap&quot;
            sentinel is <code>type(uint128).max</code>.
          </li>
          <li>
            <strong className="text-paper">Transfer policies</strong> —
            allowlist/blocklist gates on senders, receivers, or executors via
            a separate PolicyRegistry precompile.
          </li>
          <li>
            <strong className="text-paper">Freeze-and-seize</strong> — burn
            tokens held by a blocked address.
          </li>
          <li>
            <strong className="text-paper">ERC-2612 permits</strong> —
            signature-based approvals, no separate transaction needed.
          </li>
          <li>
            <strong className="text-paper">Transfer memos</strong> — attach a{" "}
            <code>bytes32</code> note to a transfer, handy for order IDs.
          </li>
        </ul>
      </Section>

      <Section title="How creation actually works on-chain">
        <p>
          Every B20 token is created by one call to the singleton{" "}
          <strong className="text-paper">B20 Factory</strong> precompile at{" "}
          <code className="break-all">0xB20F000000000000000000000000000000000000</code>:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-line bg-ink p-3 font-mono text-xs text-mute">
{`createB20(variant, salt, params, initCalls) → address token`}
        </pre>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <code>variant</code> — <code>ASSET</code> or{" "}
            <code>STABLECOIN</code>.
          </li>
          <li>
            <code>salt</code> — caller-chosen entropy. The resulting address
            is <strong className="text-paper">deterministic</strong>, derived
            from <code>(variant, your address, salt)</code> — which is exactly
            what the live preview panel on this page computes for you before
            you sign anything.
          </li>
          <li>
            <code>params</code> — ABI-encoded name, symbol, admin, and
            decimals.
          </li>
          <li>
            <code>initCalls</code> — a batch of setup calls (grant roles, set
            a supply cap) that run atomically in the same transaction, before
            the token is &quot;sealed.&quot;
          </li>
        </ul>
        <p>
          This app encodes that call exactly the way Base&apos;s own
          <code> B20FactoryLib</code> Solidity helper does, so the bytes it
          sends match what <code>base-forge</code> would produce.
        </p>
      </Section>

      <Section title="Where this lives">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-paper">Base Sepolia</strong> (chain ID{" "}
            84532) — what this app targets. B20 has been active here since
            Beryl hit the testnet.
          </li>
          <li>
            <strong className="text-paper">Base mainnet</strong> — Beryl,
            including B20, activates at a scheduled mainnet hard-fork; check
            Base&apos;s changelog for the current status before assuming it&apos;s
            live there.
          </li>
        </ul>
        <p className="text-xs text-mute">
          One clarification worth repeating from Base&apos;s own docs: B20 is
          a standard for <em>third-party issuers</em> to create their own
          tokens. It is not, by itself, an announcement of a native Base
          network token.
        </p>
      </Section>

      <Section title="Sources">
        <ul className="list-disc space-y-1 pl-5 text-xs text-mute">
          <li>docs.base.org — &quot;Launch a B20 Token&quot;</li>
          <li>docs.base.org — B20 token standard spec (Beryl)</li>
          <li>github.com/base/base-std — reference Solidity interfaces</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h3 className="font-display text-base font-semibold text-paper">{title}</h3>
      <div className="space-y-3 text-sm leading-relaxed text-mute">{children}</div>
    </div>
  );
}

function VariantCard({ name, blurb }: { name: string; blurb: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink p-4">
      <span className="font-mono text-xs uppercase tracking-wider text-baselight">
        {name}
      </span>
      <p className="mt-1.5 text-sm text-mute">{blurb}</p>
    </div>
  );
}
