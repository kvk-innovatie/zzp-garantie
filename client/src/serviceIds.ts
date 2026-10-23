/**
 * Identifies ZZP Garantie to the wallet_connect server, which maps it to a
 * verification_server usecase and the attributes to request. No API key here on
 * purpose — the page calls its own backend, which attaches the key server-side.
 */
export const SERVICE_ID = import.meta.env.VITE_SERVICE_ID || "EH_BA52C36292832725";

/**
 * The issuance registration, a different service than the disclosure one above:
 * that one reads the LPID, this one writes the ZZP Garantie credential back
 * into the wallet.
 */
export const ISSUANCE_SERVICE_ID =
  import.meta.env.VITE_ISSUANCE_SERVICE_ID || "EH_E3081FE14CB790A8";
