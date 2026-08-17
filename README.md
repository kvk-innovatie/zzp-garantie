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
│  (Vite, 7011)  │          │  (7010)      │                    │    (9070)      │
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

The verification service runs on the server: `postgres`, `pid_issuer`,
`wallet_provider`, `verification_server` and `wallet_connect` are all up on
`nbwallet.org`, and the wallet already holds an LPID. Nothing from the nb-wallet
repo has to run here — only this repo does.

```bash
cp server/.env.example server/.env              # fill in WALLET_CONNECT_API_KEY
(cd server && npm install && npm run dev)       # :7010
(cd client && npm install && npm run dev)       # :7011
```

Then open <http://localhost:7011>.

`WALLET_CONNECT_URL` points at `https://nbwallet.org/wc`, and the Vite dev server
proxies `/api` to the backend so the API key stays server-side. One call does not
go that way: the button polls the session status straight from the browser, which
makes it cross-origin — so `wallet_connect` on the server has to list
`http://localhost:7011` in its `ALLOWED_ORIGINS`.

### In Docker

`docker compose up --build` builds the SPA, bakes it into a Node image and
serves both from one process on <http://localhost:7010>. There is no Vite proxy
in that setup: Express hands out the built page and answers `/api` on the same
origin, which is what the button needs.

`VITE_CLIENT_ID` is a build argument rather than an environment variable,
because Vite inlines it into the bundle — changing it means rebuilding. The
runtime values sit in `docker-compose.yml`, except the API key, which Compose
reads from `server/.env` so it stays uncommitted.

### Deploying

```bash
./deploy.sh
```

Builds the image locally, streams it to the server with `docker save | ssh
docker load` (no registry), copies `docker-compose.yml` and `server/.env`, then
restarts the container and checks `/healthz`. Target and credentials come from
the environment:

| Variable | Default |
| --- | --- |
| `DEPLOY_HOST` | `zzpgarantie.mayersoftwaredevelopment.nl` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_SSH_KEY` | `~/.ssh/id_ed25519` |
| `DEPLOY_DIR` | `/root/zzp-garantie` |

`nginx.conf` is an example vhost for that host: it terminates TLS and reverse
proxies to the container on 7010. Install it once by hand, then run
`certbot --nginx -d zzpgarantie.mayersoftwaredevelopment.nl` — certbot rewrites
the file to add the 443 block and the redirect. `deploy.sh` does not touch it.

### On a physical phone

The wallet fetches the disclosure request from the verification server's public
listener, which is on `nbwallet.org` and therefore reachable from the phone as
it is — nothing to arrange for that half.

The page is the half that has to be reachable, and `http://localhost:7011` is
not. Either use the deployed site, or bind the dev server to the machine's LAN
IP and add that origin to `wallet_connect`'s `ALLOWED_ORIGINS`, since the status
polling is cross-origin:

```bash
(cd client && npm run dev -- --host)            # http://<lan-ip>:7011
```

## Configuration

Copy `server/.env.example` to `server/.env` and fill it in — `.env` is gitignored.

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `7010` | Port the backend listens on |
| `WALLET_CONNECT_URL` | `http://localhost:9070` | Upstream wallet_connect. `https://nbwallet.org/wc` for the deployed service — the `/wc` prefix is where nginx fronts it, since `/api/` on that host is attestation_storage. |
| `WALLET_CONNECT_API_KEY` | *(none — required)* | Must match the `apiKey` on the `zzp_garantie` entry in `wallet_connect/clients.json` in the nb-wallet repo. The backend refuses to start without it. |

Frontend: `VITE_CLIENT_ID` (default `zzp_garantie`).

## The button

`client/` installs `wallet-connect-button-react` from npm, and uses it like this
([`src/App.tsx`](client/src/App.tsx)):

```jsx
<WalletConnectButton
  clientId={CLIENT_ID}
  nbwallet
  label="Deel gegevens met uw business wallet"
  lang="nl"
  onSuccess={handleSuccess}
/>
```

`nbwallet` is what points it at this stack: it selects `https://nbwallet.org/wc`
as the wallet_connect host and the `businesswalletdebuginteraction://nbwallet.org`
deep link scheme. Without it the button targets wallet-connect.eu.

**No `apiKey` prop**, which is the other half of the setup. The component reads
`apiKey ? walletConnectHost : ""` when building its URLs, so leaving it off makes
`/api/create-session` and `/api/disclosed-attributes` same-origin — through the
backend above, with the key never reaching the page. That is the "secure, via
backend" variant from the wallet-connect examples. Passing `apiKey` here would
flip both calls to direct and publish the key.

`onSuccess` receives the disclosed claims at the top level (`attrs.euid`,
`attrs.legal_name`), plus `_byCredential` carrying the per-credential detail. The
page renders the two claims and offers the whole payload as the raw view.

The one call that is *not* same-origin is the status polling: wallet_connect
returns an absolute `status_url`, which the web component fetches straight from
the browser. Hence the `ALLOWED_ORIGINS` requirement above.
