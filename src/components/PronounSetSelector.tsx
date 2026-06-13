import type { PronounSet } from "../engine";
import { PRESET_PRONOUNS, presetById } from "../engine";

export function PronounSetSelector({
  value,
  onChange,
}: {
  value: PronounSet;
  onChange: (set: PronounSet) => void;
}) {
  const isCustom = !presetById(value.id);

  const update = (patch: Partial<PronounSet>) => onChange({ ...value, ...patch });

  return (
    <div>
      <label htmlFor="pronoun-set">Pronouns</label>
      <select
        id="pronoun-set"
        value={isCustom ? "custom" : value.id}
        onChange={(e) => {
          if (e.target.value === "custom") {
            onChange({ ...value, id: "custom", label: "custom" });
          } else {
            const preset = presetById(e.target.value);
            if (preset) onChange(preset);
          }
        }}
      >
        {PRESET_PRONOUNS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
        <option value="custom">custom…</option>
      </select>

      {isCustom && (
        <div className="row" style={{ marginTop: 8 }}>
          {(["subj", "obj", "pos", "posp", "self"] as const).map((role) => (
            <input
              key={role}
              className="field-input"
              style={{ width: 90 }}
              aria-label={role}
              placeholder={role}
              value={value[role]}
              onChange={(e) => update({ [role]: e.target.value })}
            />
          ))}
          <select
            aria-label="grammatical number"
            value={value.number}
            onChange={(e) => update({ number: e.target.value as "singular" | "plural" })}
          >
            <option value="singular">singular verbs (is)</option>
            <option value="plural">plural verbs (are)</option>
          </select>
        </div>
      )}
    </div>
  );
}
