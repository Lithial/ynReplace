import { useMemo, useState } from "react";
import type { ParseResult, PronounSet } from "../engine";
import { render as renderStory } from "../engine";

export function ResultStep({
  parsed,
  fields,
  pronounSet,
}: {
  parsed: ParseResult;
  fields: Record<string, string>;
  pronounSet: PronounSet;
}) {
  const [copied, setCopied] = useState(false);
  const result = useMemo(
    () => renderStory(parsed, { fields, pronounSet }),
    [parsed, fields, pronounSet],
  );

  const displayText = useMemo(() => {
    if (result.missing.length === 0) return result.text;
    return result.missing.reduce((t, name) => t.replaceAll(`{${name}}`, "___"), result.text);
  }, [result.text, result.missing]);

  const downloadHref = useMemo(
    () => `data:text/plain;charset=utf-8,${encodeURIComponent(result.text)}`,
    [result.text],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section>
      {result.missing.length > 0 && (
        <p className="missing">Unfilled fields shown in the text: {result.missing.join(", ")}</p>
      )}
      <div className="result" data-testid="result">
        {displayText || <span style={{ opacity: 0.5 }}>Your personalized story appears here.</span>}
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button type="button" className="primary" onClick={copy}>
          {copied ? "Copied!" : "Copy text"}
        </button>
        <a className="ghost" href={downloadHref} download="story.txt">
          Download .txt
        </a>
      </div>
    </section>
  );
}
