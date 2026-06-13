import { useEffect, useMemo, useState } from "react";
import { ProfileBar } from "./components/ProfileBar";
import { StepBar } from "./components/StepBar";
import type { PronounSet } from "./engine";
import { parse, presetById } from "./engine";
import { ResultStep } from "./steps/ResultStep";
import { StoryStep } from "./steps/StoryStep";
import { ValuesStep } from "./steps/ValuesStep";
import { loadSession, saveSession } from "./storage/autosave";
import type { Profile } from "./storage/profiles";

const DEFAULT_SET = presetById("they") as PronounSet;
const EMPTY_FIELDS: Record<string, string> = {};

function initialValues() {
  const saved = loadSession();
  if (!saved) {
    return { story: "", fields: EMPTY_FIELDS, pronounSet: DEFAULT_SET };
  }
  return { story: saved.story, fields: saved.fields, pronounSet: saved.pronounSet };
}

export default function App() {
  const [init] = useState(initialValues);
  const [step, setStep] = useState(0);
  const [story, setStory] = useState(init.story);
  const [fields, setFields] = useState<Record<string, string>>(init.fields);
  const [pronounSet, setPronounSet] = useState<PronounSet>(init.pronounSet);

  const parsed = useMemo(() => parse(story), [story]);

  useEffect(() => {
    saveSession({ story, fields, pronounSet });
  }, [story, fields, pronounSet]);

  const applyProfile = (profile: Profile) => {
    setFields(profile.fields);
    setPronounSet(profile.pronounSet);
  };

  return (
    <div className="app">
      <h1>ynReplace</h1>
      <StepBar current={step} onChange={setStep} />
      <ProfileBar fields={fields} pronounSet={pronounSet} onApply={applyProfile} />
      {step === 0 && <StoryStep story={story} onChange={setStory} onNext={() => setStep(1)} />}
      {step === 1 && (
        <ValuesStep
          fields={parsed.fields}
          values={fields}
          onChangeValue={(name, value) => setFields((f) => ({ ...f, [name]: value }))}
          pronounSet={pronounSet}
          onChangePronounSet={setPronounSet}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && <ResultStep parsed={parsed} fields={fields} pronounSet={pronounSet} />}
    </div>
  );
}
