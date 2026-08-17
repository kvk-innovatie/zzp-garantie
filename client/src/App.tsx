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
 * top level, exactly as the published examples assume. `_byCredential` rides
 * along under an underscore so it cannot be mistaken for a claim, and is the
 * only structure left to show in the debug view.
 */
interface DisclosedAttributes {
  euid?: string;
  legal_name?: string;
  _byCredential?: Record<string, Record<string, unknown>>;
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

          <dl className="attributes">
            <div>
              <dt>Naam van de organisatie</dt>
              <dd>{attributes.legal_name ?? <span className="missing">niet gedeeld</span>}</dd>
            </div>
            <div>
              <dt>EUID</dt>
              <dd>{attributes.euid ?? <span className="missing">niet gedeeld</span>}</dd>
            </div>
          </dl>

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
        Demo relying party — wallet_connect client <code>{CLIENT_ID}</code>
      </footer>
    </main>
  );
}
