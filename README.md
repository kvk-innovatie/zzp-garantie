# ZZP Garantie — demo relying party

A worked example of a third-party website asking a user's NB Wallet for company
data. ZZP Garantie is a fictional provider of guarantee schemes for self-employed
entrepreneurs; to process an application it needs the applicant's company name
and EUID, which it requests from the **LPID** credential in the user's business
wallet instead of asking them to type it in.

It is a standalone relying party: it holds no wallet infrastructure of its own.
It talks to `wallet_connect` in the [nb-wallet](../nb-wallet) repo, which together
with `verification_server` forms the verification service on the nb-wallet side.

```
┌────────────────┐  /api/*  ┌──────────────┐  /api/* + api key  ┌────────────────┐
│  React page    │─────────▶│  backend     │───────────────────▶│ wallet_connect │
│  (Vite, 9061)  │          │  (9060)      │                    │    (9070)      │
└────────────────┘          └──────────────┘                    └────────┬───────┘
        │                    holds the API key                           │
        │ nl-wallet-button → universal link                              ▼
        ▼                                              verification_server (9011/9012)
   NB Wallet app ──────────────────────────────────────────────▶ public listener
```

## The backend

One handler:

```js
app.all("/api/*", proxyToWalletConnect);   // adds Authorization: Bearer <api key>
```

That is the whole relying-party integration. All disclosure logic — which
usecase to run, which attributes to ask for, reading them back off the
verification server — lives in `wallet_connect`. The only job here is keeping
the API key off the browser, which is exactly the split the
`wallet-connect-example-react` backend in the `integration-examples` repo uses.

It is a catch-all rather than a route per endpoint because the button calls
three paths same-origin over the course of a disclosure: `/api/create-session`
(via `start-url`), `/api/disclosure/sessions/…` while polling, and
`/api/disclosed-attributes` at the end.

## Running it

Requires a devenv with `postgres`, `pid_issuer`, `wallet_provider` and
`verification_server` up, a wallet holding an LPID, and `wallet_connect` running.

```bash
# in the nb-wallet repo: mint the ZZP Garantie reader certificate, render config
cd ../nb-wallet
./scripts/setup-devenv.sh
./scripts/start-devenv.sh vs                    # verification_server

cd ../nb-wallet/wallet_core/wallet_connect && npm install && npm run dev   # :9070

# this repo
cd ../../../zzp-garantie
(cd server && npm install && npm run dev)       # :9060
(cd client && npm install && npm run dev)       # :9061
```

Then open <http://localhost:9061>.

The Vite dev server proxies `/api` to the backend, so the page only ever talks to
its own origin.

### On a physical phone

The wallet app fetches the disclosure request from the verification server's
public listener directly, so that address has to be reachable from the phone —
the machine's LAN IP, not `localhost`. Set `SERVICES_HOST` accordingly when
running `setup-devenv.sh`, since it is baked into the rendered config and the
universal links.

## Configuration

Backend (`server/.env`, all optional):

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `9060` | Port the backend listens on |
| `SERVICES_HOST` | `localhost` | Host wallet_connect runs on |
| `WALLET_CONNECT_URL` | `http://$SERVICES_HOST:9070` | Upstream |
| `WALLET_CONNECT_API_KEY` | *(demo key)* | Must match the `zzp_garantie` entry in `wallet_connect/clients.json` in the nb-wallet repo |

Frontend: `VITE_CLIENT_ID` (default `zzp_garantie`).

## What is requested, and where it is pinned

Three places have to agree, and the wallet enforces the last of them:

1. **`scripts/devenv/zzp_garantie_reader_auth.json`** (nb-wallet) — baked into the reader
   certificate. The wallet refuses any request for an attribute the certificate
   does not authorise, so this is the real boundary.
2. **`[usecases.zzp_garantie]`** in
   `scripts/devenv/demo_rp_verification_server.toml.template` (nb-wallet) — binds the usecase
   to that certificate and key.
3. **`requestedAttributes`** on the `zzp_garantie` client in
   `wallet_connect/clients.json` in the nb-wallet repo — what is asked for per session.

Widening the request means editing 1 and 3 and re-running `setup-devenv.sh` so
the certificate is reissued. The LPID's claims are declared in
nb-wallet's `scripts/devenv/eudi_lpid_nl_1.json`; `euid` and `legal_name` are both top-level
and disclosed as `dc+sd-jwt`.

## The button

`client/` uses `wallet-connect-button-react` from the `integration-examples` repo
via a `file:` dependency. No `apiKey` prop is passed — that is what makes the
component call `/api/create-session` and `/api/disclosed-attributes` same-origin,
i.e. through the backend above. This is the "secure, via backend" variant in that
repo's example app.

One prop was added upstream for this setup: `deepLinkUls={false}`. wallet-connect
derives both universal links up-front from the client id, because its server
turns `/disclosure/{clientId}/request_uri` into a session on the fly. A plain
nl-wallet verification server keys `request_uri` by *session token*, so the links
can only exist once `start-url` has created the session. Setting this to `false`
lets the web component derive them — the integration the in-repo
`demo_relying_party` uses. Without it the wallet would be sent to
wallet-connect.eu.
