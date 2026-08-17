import { CodeBlock } from "./CodeBlock";

/**
 * The "secure approach" integration example from wallet-connect's own
 * IntegrationExamples component (React frontend + Node.js backend variant),
 * with the values and the proxy shape of this app rather than the generic ones,
 * so the page describes the code it is running: no apiKey prop on the button,
 * the key attached server-side.
 */

const INSTALL = "npm install wallet-connect-button-react@latest";

const REACT = `import WalletConnectButton from 'wallet-connect-button-react';
import { useState } from 'react';

function App() {
  const [attributes, setAttributes] = useState(null);

  if (attributes) {
    return (
      <div>
        <h3>Received attributes:</h3>
        <pre>{JSON.stringify(attributes, null, 2)}</pre>
      </div>
    );
  }

  return (
    <WalletConnectButton
      clientId="zzp_garantie"
      nbwallet
      label="Deel gegevens met uw business wallet"
      lang="nl"
      onSuccess={(attrs) => {
        setAttributes(attrs);
      }}
    />
  );
}

export default App;`;

const STYLING = `/* Add to your CSS file */
nl-wallet-button::part(button) {
  border-radius: 6px;
  padding: 12px 20px;
  margin: 4px;
}

nl-wallet-button::part(button-span) {
  font-weight: bold;
}`;

const BACKEND = `import express from 'express';
import axios from 'axios';

const app = express();

app.use(express.json());

const WALLET_CONNECT_URL = 'https://nbwallet.org/wc';
const apiKey = 'xxx';

// Forward every /api call to wallet_connect with the API key attached, so the
// key never reaches the browser. The button asks for these same-origin because
// it is used without an apiKey prop.
async function proxyToWalletConnect(req, res) {
  try {
    const response = await axios({
      method: req.method,
      url: \`\${WALLET_CONNECT_URL}\${req.originalUrl}\`,
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      },
      data: req.body,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(502).json({ error: 'Proxy error', message: error.message });
    }
  }
}

app.all('/api/*', proxyToWalletConnect);

app.listen(7010, () => {
  console.log('Backend running on port 7010');
});`;

export function IntegrationExample() {
  return (
    <section className="card integration">
      <h2>Integratievoorbeeld</h2>
      <p className="lead">
        Zo bouwt u deze knop in uw eigen applicatie in: de React-component in de
        frontend, en een backend die de API-sleutel toevoegt zodat die nooit in
        de browser terechtkomt.
      </p>

      <h3 className="integration-heading">Frontend</h3>

      <div className="step">
        <h4>1. Install the component</h4>
        <CodeBlock code={INSTALL} language="bash" />
      </div>

      <div className="step">
        <h4>2. Use in your React code</h4>
        <CodeBlock code={REACT} language="jsx" />
      </div>

      <div className="step">
        <h4>3. Add custom styling (optional)</h4>
        <CodeBlock code={STYLING} language="css" />
      </div>

      <h3 className="integration-heading">Backend</h3>

      <div className="step">
        <CodeBlock code={BACKEND} language="javascript" />
      </div>
    </section>
  );
}
