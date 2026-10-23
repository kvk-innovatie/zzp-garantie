import { ReactNode, useEffect, useState } from "react";
import WalletConnectButton from "wallet-connect-button-react";

import { ISSUANCE_SERVICE_ID } from "./serviceIds";
import "./mobile.css";

/**
 * Mobile demo of the zzpgarantie.nl "Doe de check" flow, after
 * https://zzpgb.webtify.dev/kijk-waar-je-staat/.
 *
 * The real check is an embedded wizard: DigiD/wallet login, company data,
 * btw-id, some twenty-six questions, policy upload, verification, result,
 * account. This demo picks it up at step three (the btw-id, as if "volgende"
 * was pressed twice), keeps five screens, and ends on the result page with the
 * issuance button so the certificate can go straight into the wallet.
 */

interface Question {
  key: string;
  text: string;
  help: string;
  options: string[];
}

/** Three of the real questions, verbatim from the check. */
const QUESTIONS: Question[] = [
  {
    key: "business_status",
    text: "Wat is uw situatie?",
    help: "De beginsituatie van de ondernemer is van belang voor de context waarin de werkzaamheden worden verricht.",
    options: ["Ik ben al ZZPer", "Ik wil als ZZPer beginnen"],
  },
  {
    key: "business_activity",
    text: "Wat doet uw onderneming?",
    help: "De aard van de werkzaamheden geeft inzicht in de economische activiteit en de zelfstandigheid van de onderneming.",
    options: ["Ik lever diensten", "Ik verkoop goederen"],
  },
  {
    key: "entrepreneurial_income",
    text: "Verdient u momenteel geld als ondernemer?",
    help: "Inkomsten uit onderneming kunnen wijzen op actieve bedrijfsvoering en economische zelfstandigheid.",
    options: ["Ja", "Nee"],
  },
];

const RESULT_GOOD = [
  "Bedrijfsstatus",
  "Bedrijfsactiviteit",
  "Ondernemersinkomen",
  "Intentie tot bedrijfscontinuiteit",
  "Acquisitie-inspanning",
  "Eigen website of online zichtbaarheid",
  "Bedrijfsmiddelen",
  "Zakelijke bankrekening",
  "Professionele registratie",
  "Aansprakelijkheid voor schulden",
  "Debiteurenrisico",
  "Financieel risico bij kwaliteit",
  "Investeringsrisico",
  "Klantconcentratie",
  "Duur zelfstandig ondernemerschap",
  "Gemiddeld uurtarief",
  "Meerdere opdrachtgevers",
  "Relatie met laatste opdrachtgever",
  "Autonomie in werkwijze",
  "Autonomie in prijsstelling",
  "Eigen materiaal of gereedschap",
  "Vervangingsrecht",
  "Rechtstreekse facturatie",
];

const RESULT_IMPROVE = [
  "Geldig btw-nummer (VIES)",
  "Actieve reclame",
  "Zakelijke verzekering",
  "Risico bij ziekte",
];

const RESULT_COULD: string[] = [];

/**
 * Screens in order. The three questions are one screen each, so this is five
 * steps before the result.
 */
type Screen = "vat" | "q0" | "q1" | "q2" | "checking" | "result";
const SCREENS: Screen[] = ["vat", "q0", "q1", "q2", "checking", "result"];

const SUBTITLES: Record<Screen, string> = {
  vat: "Je btw-id",
  q0: "Een paar vragen",
  q1: "Een paar vragen",
  q2: "Een paar vragen",
  checking: "Wij zijn aan het checken…",
  result: "Uitslag",
};

export function Mobile() {
  const [screen, setScreen] = useState<Screen>("vat");
  const [hasVat, setHasVat] = useState<boolean | null>(true);
  const [vatNumber, setVatNumber] = useState("NL001234567B01");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const go = (next: Screen) => {
    setError(null);
    setScreen(next);
    window.scrollTo({ top: 0 });
  };
  const back = () => go(SCREENS[Math.max(SCREENS.indexOf(screen) - 1, 0)]);
  const forward = () => go(SCREENS[Math.min(SCREENS.indexOf(screen) + 1, SCREENS.length - 1)]);

  const restart = () => {
    setHasVat(true);
    setVatNumber("NL001234567B01");
    setAnswers({});
    go("vat");
  };

  let body: ReactNode;
  if (screen === "vat") {
    body = (
      <VatStep
        hasVat={hasVat}
        vatNumber={vatNumber}
        onHasVatChange={(v) => {
          setHasVat(v);
          setError(null);
        }}
        onVatNumberChange={(v) => {
          setVatNumber(v);
          setError(null);
        }}
        error={error}
        onNext={() => {
          if (hasVat === null) return setError("Maak een keuze.");
          if (hasVat && !/^[A-Z]{2}[A-Z0-9]{8,12}$/i.test(vatNumber.replace(/[\s.-]/g, ""))) {
            return setError("Vul een geldig btw-id in, bijvoorbeeld NL123456789B01.");
          }
          forward();
        }}
      />
    );
  } else if (screen === "checking") {
    body = <CheckingStep hasVat={hasVat === true} onNext={forward} />;
  } else if (screen === "result") {
    body = <ResultStep onBack={back} onRestart={restart} />;
  } else {
    const index = Number(screen.slice(1));
    const question = QUESTIONS[index];
    body = (
      <QuestionStep
        question={question}
        index={index}
        total={QUESTIONS.length}
        selected={answers[question.key] ?? ""}
        onSelect={(value) => {
          setAnswers((a) => ({ ...a, [question.key]: value }));
          setError(null);
        }}
        error={error}
        onBack={back}
        onNext={() => {
          if (!answers[question.key]) return setError("Maak een keuze.");
          forward();
        }}
      />
    );
  }

  return (
    <div className="mobile">
      <header className="mobile-header">
        <a href="/mobile" onClick={(e) => e.preventDefault()} className="mobile-logo">
          <img src="/zzp-garantie-logo.png" alt="ZZP Garantie" width="1024" height="414" />
        </a>
        <button type="button" className="mobile-menu" aria-label="Menu">
          <span />
          <span />
          <span />
        </button>
      </header>

      <section className="mobile-check">
        <div className={`check-card${screen === "result" ? " with-wallet-bar" : ""}`}>
          <header className="check-head">
            <h2>Doe de check</h2>
            <p>{SUBTITLES[screen]}</p>
          </header>
          {body}
        </div>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- steps */

function VatStep({
  hasVat,
  vatNumber,
  onHasVatChange,
  onVatNumberChange,
  error,
  onNext,
}: {
  hasVat: boolean | null;
  vatNumber: string;
  onHasVatChange: (v: boolean) => void;
  onVatNumberChange: (v: string) => void;
  error: string | null;
  onNext: () => void;
}) {
  const nextLabel =
    hasVat === false ? "verder zonder btw-id" : hasVat === true ? "controleer en verder" : "volgende";
  return (
    <>
      <p className="check-text">
        Voor je certificaat controleren we je btw-identificatienummer (btw-id) bij VIES, het
        Europese btw-register.
      </p>

      <fieldset className="check-field">
        <legend>Heb je een btw-id?</legend>
        <div className="choice-row" role="radiogroup" aria-label="Heb je een btw-id?">
          {[
            { value: true, label: "ja" },
            { value: false, label: "nee" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              role="radio"
              aria-checked={hasVat === o.value}
              className={`choice${hasVat === o.value ? " selected" : ""}`}
              onClick={() => onHasVatChange(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      {hasVat === true && (
        <>
          <div className="check-field">
            <label htmlFor="vat-number">Je btw-id</label>
            <input
              id="vat-number"
              className="check-input"
              value={vatNumber}
              onChange={(e) => onVatNumberChange(e.target.value)}
              placeholder="NL123456789B01"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={!!error}
            />
          </div>
          <p className="check-help">Je vindt je btw-id op je facturen en in Mijn Belastingdienst Zakelijk.</p>
        </>
      )}

      {hasVat === false && (
        <p role="alert" className="check-warning">
          Zonder btw-id kunnen we dit onderdeel niet controleren. Dat telt als een verbeterpunt in je
          uitslag.
        </p>
      )}

      {error && (
        <p role="alert" className="check-error">
          {error}
        </p>
      )}

      <Nav backDisabled onBack={() => {}} onNext={onNext} nextLabel={nextLabel} />
    </>
  );
}

function QuestionStep({
  question,
  index,
  total,
  selected,
  onSelect,
  error,
  onBack,
  onNext,
}: {
  question: Question;
  index: number;
  total: number;
  selected: string;
  onSelect: (value: string) => void;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const page = index + 1;
  return (
    <>
      <fieldset className="check-field">
        <legend>{question.text}</legend>
        <div className="radio-list">
          {question.options.map((option) => {
            const checked = option === selected;
            return (
              <label key={option} className="radio">
                <input
                  type="radio"
                  name={`question-${question.key}`}
                  value={option}
                  checked={checked}
                  onChange={() => onSelect(option)}
                  className="sr-only"
                />
                <span aria-hidden="true" className={`diamond small${checked ? " lime" : ""}`} />
                {option}
              </label>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="check-error">
            {error}
          </p>
        )}
      </fieldset>
      <p className="check-help">{question.help}</p>

      <Nav onBack={onBack} onNext={onNext}>
        <div className="progress">
          <span>
            vraag {page} van {total}
          </span>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={page}
          >
            <div className="progress-fill" style={{ width: `${Math.round((page / total) * 100)}%` }} />
          </div>
        </div>
      </Nav>
    </>
  );
}

type LineState = "running" | "passed" | "failed" | "skipped";

const LINE_TEXT: Record<LineState, string> = {
  running: "bezig…",
  passed: "",
  failed: "",
  skipped: "niet van toepassing",
};

/**
 * The verification screen, staged for the demo: KVK and VIES "run" one after
 * the other and pass; the bank check needs an answer this demo does not ask
 * for, so it stays not applicable, as on the real page.
 */
function CheckingStep({ hasVat, onNext }: { hasVat: boolean; onNext: () => void }) {
  const [lines, setLines] = useState<Record<"kvk" | "vies" | "bank", LineState>>({
    kvk: "running",
    vies: "running",
    bank: "skipped",
  });
  const done = lines.kvk !== "running" && lines.vies !== "running";

  useEffect(() => {
    const t1 = window.setTimeout(() => setLines((l) => ({ ...l, kvk: "passed" })), 900);
    const t2 = window.setTimeout(
      () => setLines((l) => ({ ...l, vies: hasVat ? "passed" : "failed" })),
      1900,
    );
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [hasVat]);

  return (
    <>
      <ul className="result-list checking">
        {(
          [
            ["KVK", lines.kvk],
            ["VIES", lines.vies],
            ["SurePay API", lines.bank],
          ] as [string, LineState][]
        ).map(([label, state]) => (
          <li key={label}>
            <span
              aria-hidden="true"
              className={`diamond ${
                state === "passed" ? "lime" : state === "running" ? "lime pulse" : state === "failed" ? "orange" : "dark"
              }`}
            >
              <span className="glyph">{state === "passed" ? "✓" : state === "failed" ? "!" : ""}</span>
            </span>
            <span>{label}</span>
            {LINE_TEXT[state] && <span className="muted">{LINE_TEXT[state]}</span>}
          </li>
        ))}
      </ul>

      {done && <Nav backDisabled onBack={() => {}} onNext={onNext} nextLabel="Bekijk uitslag" />}
    </>
  );
}

function ResultStep({ onBack, onRestart }: { onBack: () => void; onRestart: () => void }) {
  const groups = [
    { title: "Dit gaat goed!", tone: "lime", icon: "✓", items: RESULT_GOOD },
    { title: "Dit moet beter", tone: "orange", icon: "", items: RESULT_IMPROVE },
    { title: "Dit kan nog beter", tone: "dark", icon: "", items: RESULT_COULD },
  ];
  return (
    <>
      {groups.map((group) => (
        <section className="result-group" key={group.title}>
          <h3>{group.title}</h3>
          {group.items.length === 0 ? (
            <p className="muted">—</p>
          ) : (
            <ul className="result-list">
              {group.items.map((item) => (
                <li key={item}>
                  <span aria-hidden="true" className={`diamond ${group.tone}`}>
                    <span className="glyph">{group.icon}</span>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <Nav onBack={onBack} onNext={onRestart} nextLabel="opnieuw" />

      {/* Pinned to the bottom of the screen, so the certificate is one tap
          away however far down the list the reader is. */}
      <section className="wallet-bar">
        <WalletConnectButton
          issuance
          serviceId={ISSUANCE_SERVICE_ID}
          nbwallet
          label="Voeg certificaat toe aan je wallet"
          lang="nl"
          // Required by the component's types. Issuance hands the credential
          // to the wallet rather than back to this page, so there is nothing
          // for the page to do with it.
          onSuccess={() => {}}
        />
      </section>
    </>
  );
}

/* ------------------------------------------------------------ nav footer */

function Nav({
  children,
  onBack,
  onNext,
  backDisabled = false,
  nextLabel = "volgende",
}: {
  children?: ReactNode;
  onBack: () => void;
  onNext: () => void;
  backDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <footer className="check-nav">
      {children}
      <button type="button" className="btn dark" onClick={onBack} disabled={backDisabled}>
        vorige
      </button>
      <button type="button" className="btn primary" onClick={onNext}>
        {nextLabel}
      </button>
    </footer>
  );
}
