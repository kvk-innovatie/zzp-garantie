import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT || 7010);

/**
 * The nb-wallet-side wallet_connect server (see wallet_core/wallet_connect).
 *
 * Locally that is the devenv on port 9070. Against the deployed service it is
 * `https://<host>/wc` — the `/wc` prefix is where nginx fronts wallet_connect,
 * because `/api/` on that host is already attestation_storage.
 */
export const WALLET_CONNECT_URL =
  process.env.WALLET_CONNECT_URL || "http://localhost:9070";

/**
 * Identifies ZZP Garantie to wallet_connect. Must match the `apiKey` on the
 * `zzp_garantie` entry in wallet_connect's `clients.json`.
 *
 * No default on purpose: this is the credential that keeps the disclosure
 * endpoints from being callable by anyone who can reach them, so it comes from
 * the environment (see `.env.example`) and is never committed. Failing loudly
 * here beats sending `Bearer undefined` and debugging a 401 from the far side.
 */
export const API_KEY = process.env.WALLET_CONNECT_API_KEY;

if (!API_KEY) {
  console.error(
    "WALLET_CONNECT_API_KEY is not set — copy .env.example to .env and fill it in.",
  );
  process.exit(1);
}
