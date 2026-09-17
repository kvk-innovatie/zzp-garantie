import { useCallback, useState } from "react";
import WalletConnectButton from "wallet-connect-button-react";

import { IntegrationExample } from "./IntegrationExample";

/**
 * Identifies ZZP Garantie to the wallet_connect server, which maps it to a
 * verification_server usecase and the attributes to request. No API key here on
 * purpose — the page calls its own backend, which attaches the key server-side.
 */
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || "zzp_garantie";

/**
 * What the button hands to `onSuccess`: the disclosed claims themselves, at the
 * top level, exactly as the published examples assume. Only scalar claims make
 * it to the top level; `_byCredential` holds every claim per credential type,
 * nested values included, so that is what the page renders.
 */
interface DisclosedAttributes {
  euid?: string;
  legal_name?: string;
  _byCredential?: Record<string, Record<string, unknown>>;
  [claim: string]: unknown;
}

const CREDENTIAL_NAMES: Record<string, string> = {
  "urn:eudi:lpid:nl:1": "Legal Person Identification Data (LPID)",
};

const CLAIM_LABELS: Record<string, string> = {
  legal_name: "Naam van de organisatie",
  euid: "EUID",
};

function labelFor(path: string[]): string {
  return path
    .map((key) => CLAIM_LABELS[key] ?? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()))
    .join(" › ");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "ja" : "nee";
  return String(value);
}

/** Every leaf of a claim set as [label path, value], nested objects and arrays spelled out. */
function flattenClaims(value: unknown, path: string[] = []): [string[], unknown][] {
  if (Array.isArray(value)) {
    if (value.every((item) => item === null || typeof item !== "object")) {
      return [[path, value.map(formatValue).join(", ")]];
    }
    return value.flatMap((item, i) => flattenClaims(item, [...path, String(i + 1)]));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => flattenClaims(child, [...path, key]));
  }
  return [[path, value]];
}

/** Claims grouped per credential; top-level claims if the per-credential view is absent. */
function groupByCredential(disclosed: DisclosedAttributes): [string, Record<string, unknown>][] {
  const byCredential = disclosed._byCredential;
  if (byCredential && Object.keys(byCredential).length > 0) return Object.entries(byCredential);

  const topLevel = Object.fromEntries(Object.entries(disclosed).filter(([key]) => !key.startsWith("_")));
  return Object.keys(topLevel).length > 0 ? [["", topLevel]] : [];
}

export default function App() {
  const [attributes, setAttributes] = useState<DisclosedAttributes | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  // Identity-stable so the button's effect doesn't re-run on every render.
  const handleSuccess = useCallback((response: Record<string, unknown> | undefined) => {
    setAttributes((response ?? {}) as DisclosedAttributes);
  }, []);

  return (
    <main className="page">
      <header className="header">
        <div className="logo" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="12" fill="#E8F3EC" />
            <path d="M32 13L48 19V31C48 40.2 41.2 48.4 32 51C22.8 48.4 16 40.2 16 31V19L32 13Z" fill="#1F7A4D" />
            <path
              d="M25 31.5L30 36.5L40 26.5"
              stroke="#fff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h1>ZZP Garantie</h1>
          <p className="tagline">Garantieregelingen voor zelfstandige ondernemers</p>
        </div>
      </header>

      {attributes ? (
        <section className="card">
          <h2>Bedrijfsgegevens ontvangen</h2>
          <p className="lead">
            Deze gegevens komen rechtstreeks uit het LPID in uw NB Wallet en zijn
            cryptografisch geverifieerd.
          </p>

          {groupByCredential(attributes).map(([vct, claims]) => (
            <div className="credential" key={vct || "claims"}>
              {vct && (
                <h3 className="credential-name">
                  {CREDENTIAL_NAMES[vct] ?? vct}
                  <code>{vct}</code>
                </h3>
              )}
              <dl className="attributes">
                {flattenClaims(claims).map(([path, value]) => (
                  <div key={path.join(".")}>
                    <dt>{labelFor(path)}</dt>
                    <dd>{formatValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          {groupByCredential(attributes).length === 0 && (
            <p className="missing">Er zijn geen gegevens gedeeld.</p>
          )}

          <div className="actions">
            <button className="secondary" onClick={() => setShowRaw((v) => !v)}>
              {showRaw ? "Verberg" : "Toon"} onbewerkte respons
            </button>
            <button
              className="secondary"
              onClick={() => {
                setAttributes(null);
                setShowRaw(false);
              }}
            >
              Opnieuw beginnen
            </button>
          </div>

          {showRaw && <pre className="raw">{JSON.stringify(attributes, null, 2)}</pre>}
        </section>
      ) : (
        <section className="card">
          <h2>Vraag uw garantiecertificaat aan</h2>
          <p className="lead">
            Om uw aanvraag te beoordelen hebben wij de naam en het EUID van uw
            onderneming nodig. Deel deze rechtstreeks vanuit uw NB Wallet — u
            hoeft niets over te typen.
          </p>

          <ul className="requested">
            <li>Naam van de organisatie</li>
            <li>EUID</li>
          </ul>

          <div className="button-row">
            <WalletConnectButton
              clientId={CLIENT_ID}
              nbwallet
              label="Deel gegevens met uw business wallet"
              lang="nl"
              onSuccess={handleSuccess}
            />
          </div>
        </section>
      )}

      <section className="card wallet-cta">
        <h2>Nog geen NB Wallet?</h2>
        <p className="lead">
          Delen gaat via de NB Wallet-app, met daarin het LPID van uw
          onderneming. De app en de installatie-instructies vindt u op{" "}
          <a href="https://nbwallet.org" target="_blank" rel="noopener noreferrer">
            nbwallet.org
          </a>
          .
        </p>
      </section>

      <IntegrationExample />

      <footer className="footer">
        <span>Demo relying party</span>
        <a
          href="https://github.com/kvk-innovatie/zzp-garantie"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
          </svg>
          broncode op GitHub
        </a>
      </footer>
    </main>
  );
}
