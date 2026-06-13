import { SAMPLE_STORY } from "../sampleStory";

export function StoryStep({
  story,
  onChange,
  onNext,
}: {
  story: string;
  onChange: (story: string) => void;
  onNext: () => void;
}) {
  return (
    <section>
      <label htmlFor="story">Paste a story (use {"{markers}"})</label>
      <textarea
        id="story"
        className="story-input"
        defaultValue={story}
        onChange={(e) => onChange(e.target.value)}
        placeholder="{Name} walked in. {Subj} {v:be} ready..."
      />
      <div className="cheat">
        <strong>Markers:</strong> <code>{"{name}"}</code> custom field · <code>{"{subj}"}</code>{" "}
        <code>{"{obj}"}</code> <code>{"{pos}"}</code> <code>{"{posp}"}</code>{" "}
        <code>{"{self}"}</code> pronouns · <code>{"{v:be}"}</code> verbs (conjugated). Capitalize
        the marker to capitalize output: <code>{"{Name}"}</code>, <code>{"{Subj}"}</code>.
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button type="button" className="ghost" onClick={() => onChange(SAMPLE_STORY)}>
          Load sample story
        </button>
        <button type="button" className="primary" onClick={onNext}>
          Next: fill in values →
        </button>
      </div>
    </section>
  );
}
