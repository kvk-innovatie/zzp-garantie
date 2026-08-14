import { useCallback, useState } from "react";
import WalletConnectButton from "wallet-connect-button-react";

/**
 * Identifies ZZP Garantie to the wallet_connect server, which maps it to a
 * verification_server usecase and the attributes to request. No API key here on
 * purpose — the page calls its own backend, which attaches the key server-side.
 */
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || "zzp_garantie";

interface DisclosedAttributes {
  euid?: string;
  legal_name?: string;
}

interface DisclosureResponse {
  attributes?: DisclosedAttributes;
  raw?: unknown;
}

export default function App() {
  const [attributes, setAttributes] = useState<DisclosedAttributes | null>(null);
  const [raw, setRaw] = useState<unknown>(null);
  const [showRaw, setShowRaw] = useState(false);

  // Identity-stable so the button's effect doesn't re-run on every render.
  // The button types its payload as a loose attribute bag; narrow it here to
  // the `{ attributes, raw }` envelope the middleware actually returns.
  const handleSuccess = useCallback((response: Record<string, unknown> | undefined) => {
    const disclosure = response as DisclosureResponse | undefined;
    setAttributes(disclosure?.attributes ?? {});
    setRaw(disclosure?.raw ?? null);
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
                setRaw(null);
                setShowRaw(false);
              }}
            >
              Opnieuw beginnen
            </button>
          </div>

          {showRaw && <pre className="raw">{JSON.stringify(raw, null, 2)}</pre>}
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
              business
              label="Deel gegevens met uw business wallet"
              lang="nl"
              // The nb-wallet verification_server keys `request_uri` by session
              // token, not by client id, so the universal links can only exist
              // after `start-url` has created the session. Letting the web
              // component derive them is the integration the in-repo demo
              // relying party uses; the wallet-connect defaults would send the
              // wallet to wallet-connect.eu instead.
              deepLinkUls={false}
              onSuccess={handleSuccess}
            />
          </div>
        </section>
      )}

      <footer className="footer">
        Demo relying party — wallet_connect client <code>{CLIENT_ID}</code>
      </footer>
    </main>
  );
}
