import { useCallback, useState } from "react";
import WalletConnectButton from "wallet-connect-button-react";

import { AccountMenu } from "./AccountMenu";
import { IntegrationExample } from "./IntegrationExample";

/**
 * Identifies ZZP Garantie to the wallet_connect server, which maps it to a
 * verification_server usecase and the attributes to request. No API key here on
 * purpose — the page calls its own backend, which attaches the key server-side.
 */
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || "zzp_garantie";

/**
 * What the button hands to `onSuccess`, as wallet_connect shapes it:
 *
 *   { credentials: [ { type, name: { lang: name },
 *                      attributes: { <claim>: { name: { lang: label }, value } } } ] }
 *
 * One entry per disclosed attestation. `attributes` mirrors the credential's
 * own structure: every disclosed claim is a `{ name, value }` leaf, nested
 * claims sit in plain objects and array-of-objects claims in arrays.
 */
interface ClaimLeaf {
  name?: Record<string, string>;
  value?: unknown;
}

interface Credential {
  type: string;
  name?: Record<string, string>;
  attributes?: Record<string, unknown>;
}

interface DisclosedResponse {
  credentials?: Credential[];
  [key: string]: unknown;
}

/** Dutch label if the metadata has one, else English, else any, else the fallback. */
function displayName(names: Record<string, string> | undefined, fallback: string): string {
  if (!names) return fallback;
  return names["nl-NL"] ?? names["nl"] ?? names["en-US"] ?? names["en"] ?? Object.values(names)[0] ?? fallback;
}

function prettifyKey(key: string): string {
  return key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function isLeaf(node: unknown): node is ClaimLeaf {
  return typeof node === "object" && node !== null && !Array.isArray(node) && "value" in node;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "ja" : "nee";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Every claim leaf as [label path, value]; nested objects and arrays spelled out. */
function flattenClaims(node: unknown, path: string[] = []): [string[], unknown][] {
  if (isLeaf(node)) return [[path, node.value]];
  if (Array.isArray(node)) {
    return node.flatMap((item, i) => flattenClaims(item, [...path.slice(0, -1), `${path[path.length - 1]} ${i + 1}`]));
  }
  if (typeof node === "object" && node !== null) {
    return Object.entries(node).flatMap(([key, child]) =>
      flattenClaims(child, [...path, displayName(isLeaf(child) ? child.name : undefined, prettifyKey(key))]),
    );
  }
  return [[path, node]];
}

/** The claim stored under `key` in any credential — used for the account menu. */
function findClaim(disclosed: DisclosedResponse | null, key: string): string | undefined {
  for (const credential of disclosed?.credentials ?? []) {
    const leaf = credential.attributes?.[key];
    if (isLeaf(leaf) && leaf.value !== undefined && leaf.value !== null) return String(leaf.value);
  }
  return undefined;
}

export default function App() {
  const [attributes, setAttributes] = useState<DisclosedResponse | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  // Identity-stable so the button's effect doesn't re-run on every render.
  const handleSuccess = useCallback((response: Record<string, unknown> | undefined) => {
    setAttributes((response ?? {}) as DisclosedResponse);
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

        {attributes && (
          <AccountMenu
            legalName={findClaim(attributes, "legal_name") ?? "Onbekende onderneming"}
            euid={findClaim(attributes, "euid")}
            onLogout={() => {
              setAttributes(null);
              setShowRaw(false);
            }}
          />
        )}
      </header>

      {attributes ? (
        <section className="card">
          <h2>U bent ingelogd</h2>
          <p className="lead">
            U bent aangemeld met de gegevens uit uw NB Wallet. Deze zijn
            cryptografisch geverifieerd en hieronder ziet u alles wat u heeft
            gedeeld.
          </p>

          {(attributes.credentials ?? []).map((credential, index) => (
            <div className="credential" key={`${credential.type}-${index}`}>
              <h3 className="credential-name">
                {displayName(credential.name, credential.type)}
                <code>{credential.type}</code>
              </h3>
              <dl className="attributes">
                {flattenClaims(credential.attributes ?? {}).map(([path, value]) => (
                  <div key={path.join(" › ")}>
                    <dt>{path.join(" › ")}</dt>
                    <dd>{formatValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          {(attributes.credentials ?? []).length === 0 && (
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
