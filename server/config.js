import dotenv from "dotenv";

dotenv.config();

const SERVICES_HOST = process.env.SERVICES_HOST || "localhost";

export const PORT = Number(process.env.PORT || 9060);

/** The nb-wallet-side wallet_connect server (see wallet_core/wallet_connect). */
export const UPSTREAM =
  process.env.WALLET_CONNECT_URL || `http://${SERVICES_HOST}:9070`;

/**
 * Identifies ZZP Garantie to wallet_connect, and is what keeps the disclosure
 * endpoints from being callable by anyone who can reach them. It must match the
 * `apiKey` on the `zzp_garantie` entry in `wallet_core/wallet_connect/clients.json`.
 *
 * Checked in because this is a demo against a local devenv. A real relying party
 * would take it from the environment and never commit it.
 */
export const API_KEY =
  process.env.WALLET_CONNECT_API_KEY ||
  "8f2c1d5a4b90e37c6a1f8d2b4e05c973a86d1f4b2c9e70538a4d6b1c2f9e0a73";
