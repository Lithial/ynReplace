import { useEffect, useState } from "react";
import { StepBar } from "./components/StepBar";
import type { PronounSet } from "./engine";
import { presetById } from "./engine";
import { StoryStep } from "./steps/StoryStep";
import { loadSession, saveSession } from "./storage/autosave";

const DEFAULT_SET = presetById("they") as PronounSet;
const EMPTY_FIELDS: Record<string, string> = {};

function initialValues() {
  const saved = loadSession();
  if (!saved) {
    return { story: "", fields: EMPTY_FIELDS, pronounSet: DEFAULT_SET };
  }
  return {
    story: saved.story,
    fields: saved.fields,
    pronounSet: saved.pronounSet,
  };
}

export default function App() {
  const init = initialValues();
  const [step, setStep] = useState(0);
  const [story, setStory] = useState(init.story);
  const [fields] = useState<Record<string, string>>(init.fields);
  const [pronounSet] = useState<PronounSet>(init.pronounSet);

  useEffect(() => {
    saveSession({ story, fields, pronounSet });
  }, [story, fields, pronounSet]);

  return (
    <div className="app">
      <h1>ynReplace</h1>
      <StepBar current={step} onChange={setStep} />
      {step === 0 && <StoryStep story={story} onChange={setStory} onNext={() => setStep(1)} />}
    </div>
  );
}
