import { useState } from "react";
import type { PronounSet } from "../engine";
import {
  exportProfile,
  importProfile,
  loadProfiles,
  type Profile,
  saveProfiles,
} from "../storage/profiles";

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `p-${performance.now()}`;
}

export function ProfileBar({
  fields,
  pronounSet,
  onApply,
}: {
  fields: Record<string, string>;
  pronounSet: PronounSet;
  onApply: (profile: Profile) => void;
}) {
  const [profiles, setProfiles] = useState<Profile[]>(() => loadProfiles());
  const [selectedId, setSelectedId] = useState<string>("");

  const persist = (next: Profile[]) => {
    setProfiles(next);
    saveProfiles(next);
  };

  const saveCurrent = () => {
    const name = window.prompt("Name this profile");
    if (!name) return;
    const profile: Profile = { id: newId(), name, fields, pronounSet };
    persist([...profiles, profile]);
    setSelectedId(profile.id);
  };

  const selected = profiles.find((p) => p.id === selectedId);

  const apply = () => {
    if (selected) onApply(selected);
  };

  const remove = () => {
    if (selected) persist(profiles.filter((p) => p.id !== selected.id));
  };

  const doExport = () => {
    if (!selected) return;
    const href = `data:application/json;charset=utf-8,${encodeURIComponent(exportProfile(selected))}`;
    const a = document.createElement("a");
    a.href = href;
    a.download = `${selected.name}.json`;
    a.click();
  };

  const doImport = async (file: File) => {
    try {
      const profile = importProfile(await file.text());
      const withId: Profile = { ...profile, id: newId() };
      persist([...profiles, withId]);
      setSelectedId(withId.id);
    } catch {
      window.alert("That file is not a valid ynReplace profile.");
    }
  };

  return (
    <div className="row" style={{ margin: "8px 0 20px" }}>
      <label htmlFor="profile-select">Profile</label>
      <select
        id="profile-select"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">— none —</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button type="button" className="ghost" onClick={apply}>
        Apply
      </button>
      <button type="button" className="ghost" onClick={saveCurrent}>
        Save current…
      </button>
      <button type="button" className="ghost" onClick={remove}>
        Delete
      </button>
      <button type="button" className="ghost" onClick={doExport}>
        Export
      </button>
      <label className="ghost" style={{ cursor: "pointer" }}>
        Import
        <input
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) doImport(file);
          }}
        />
      </label>
    </div>
  );
}
