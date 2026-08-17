import { useCallback, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";

/**
 * wallet-connect's `CodeBlock`: Prism with the vscDarkPlus theme, copy button
 * in the corner. It imports the full `Prism` build, which registers every
 * language it ships with; this uses `prism-light` and registers the four we
 * actually render, for the same tokens and colours without the bundle.
 */
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("jsx", jsx);

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    // Rejects outside a secure context — serving this over plain http on a LAN
    // IP for phone testing is exactly that case, so don't let it go unhandled.
    navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      },
      () => setCopied(false),
    );
  }, [code]);

  return (
    <div className="code-block">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          fontSize: "13px",
          margin: 0,
          padding: "16px",
          paddingTop: "40px",
          borderRadius: "8px",
        }}
      >
        {code}
      </SyntaxHighlighter>
      <button type="button" className="copy" onClick={copy}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
