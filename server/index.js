import express from "express";
import axios from "axios";

import { API_KEY, PORT, WALLET_CONNECT_URL } from "./config.js";

const app = express();

app.use(express.json());

/**
 * The whole ZZP Garantie backend: forward `/api/*` to the wallet_connect server
 * with this relying party's API key attached.
 *
 * All the disclosure logic — which usecase to run, which attributes to ask for,
 * reading them back off the verification server's internal listener — lives in
 * wallet_connect, on the nb-wallet side. A relying party only has to keep its
 * API key off the browser, which is exactly what this proxy is for.
 *
 * It is deliberately a catch-all rather than a route per endpoint: the wallet
 * button calls `/api/create-session` (via `start-url`), polls
 * `/api/disclosure/sessions/…`, and finally reads `/api/disclosed-attributes`,
 * all same-origin, so a single pass-through covers the flow and stays correct
 * if the button adds a call.
 */
async function proxyToWalletConnect(req, res) {
  try {
    const response = await axios({
      method: req.method,
      url: `${WALLET_CONNECT_URL}${req.originalUrl}`,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      data: req.body,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(502).json({ error: "Proxy error", message: error.message });
    }
  }
}

app.all("/api/*", proxyToWalletConnect);

app.get("/healthz", (_req, res) =>
  res.json({ status: "ok", upstream: WALLET_CONNECT_URL }),
);

app.listen(PORT, () => {
  console.log(`ZZP Garantie backend listening on http://localhost:${PORT}`);
  console.log(`  proxying /api/* to ${WALLET_CONNECT_URL}`);
});
