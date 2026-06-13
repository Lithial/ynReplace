import { PronounSetSelector } from "../components/PronounSetSelector";
import type { PronounSet } from "../engine";

export function ValuesStep({
  fields,
  values,
  onChangeValue,
  pronounSet,
  onChangePronounSet,
  onNext,
}: {
  fields: string[];
  values: Record<string, string>;
  onChangeValue: (name: string, value: string) => void;
  pronounSet: PronounSet;
  onChangePronounSet: (set: PronounSet) => void;
  onNext: () => void;
}) {
  const empty = fields.filter((name) => !values[name]);

  return (
    <section>
      {fields.length === 0 && (
        <p>No fields found in the story. Add some {"{markers}"} in step 1.</p>
      )}
      {fields.map((name) => (
        <div className="field-row" key={name}>
          <label htmlFor={`field-${name}`}>{name}</label>
          <input
            id={`field-${name}`}
            className="field-input"
            value={values[name] ?? ""}
            onChange={(e) => onChangeValue(name, e.target.value)}
          />
        </div>
      ))}

      <div style={{ margin: "16px 0" }}>
        <PronounSetSelector value={pronounSet} onChange={onChangePronounSet} />
      </div>

      {empty.length > 0 && (
        <p className="missing">
          {empty.length} field{empty.length > 1 ? "s" : ""} still empty
        </p>
      )}

      <button type="button" className="primary" onClick={onNext}>
        Next: read &amp; export →
      </button>
    </section>
  );
}
