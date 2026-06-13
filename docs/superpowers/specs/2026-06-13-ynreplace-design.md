# ynReplace — Design Spec

**Date:** 2026-06-13
**Status:** Approved (pending user review of this document)

## Summary

ynReplace is a browser-based tool for personalizing self-insert stories. An author
writes (or a reader pastes) a story containing `{markers}`; the reader fills in their
own values — name, physical-description fields, and a pronoun set — and the tool renders
a personalized version with correct pronouns and verb agreement.

The classic `[Y/N]` ("your name") fanfic convention, generalized to arbitrary fields and
full pronoun support.

## Goals

- Let a **reader** take any marker-bearing story and instantly see it rendered with their
  own name, appearance, and pronouns.
- Let an **author** write marker-bearing stories with a tight live-preview iteration loop.
- Handle pronouns *correctly*: all five grammatical forms **and** verb agreement
  (so `they/them` reads "they are", not "they is").
- Run entirely client-side as a static site — no backend, no accounts.

## Non-Goals (deferred / out of scope for v1)

- User accounts or cross-device sync.
- Auto-detecting which words to replace (stories must already contain markers).
- Shareable URL that encodes story + values in the link.
- Exporting rendered output as styled PDF / Markdown (plain `.txt` only in v1).

## Primary user

The **reader** (personalizing someone else's story) is the primary user; the author is a
secondary but supported user. This drives the guided, step-based UI.

---

## Architecture

Static client-side web app. **Vite + React + TypeScript.** Deployable to any static host
(GitHub Pages, Netlify). All data persists in `localStorage`; portability via JSON files.

Two clean layers:

1. **Engine** — a pure, framework-agnostic TypeScript module. No React, no DOM, no
   storage. Fully unit-testable with plain function calls.
2. **UI** — React components that feed text + values into the engine and render the result.

---

## The Marker Language

Every replaceable thing is a `{...}` token. Three kinds.

### 1. Custom fields

`{name}`, `{hair color}`, `{nickname}` — any name the author chooses. The first time the
engine sees a field marker, it becomes an input the reader fills in.

**Casing rule (applies to all markers):** the casing of the marker controls output casing.

- `{name}` → "alex"
- `{Name}` → "Alex"
- `{NAME}` → "ALEX"

This lets a sentence-start marker capitalize correctly without fragile sentence-boundary
detection.

### 2. Pronoun roles

Five semantic role markers — never literal pronouns — so the author never hard-codes a
gender:

| Marker   | Role                  | she/her  | he/him  | they/them  |
|----------|-----------------------|----------|---------|------------|
| `{subj}` | subject               | she      | he      | they       |
| `{obj}`  | object                | her      | him     | them       |
| `{pos}`  | possessive adjective  | her      | his     | their      |
| `{posp}` | possessive pronoun    | hers     | his     | theirs     |
| `{self}` | reflexive             | herself  | himself | themself   |

The reader chooses a **pronoun set** (preset she/her · he/him · they/them, or a saved
custom set). Casing rule applies: `{Subj}` → "She/He/They".

### 3. Verbs

`{v:be}`, `{v:have}`, `{v:walk}` — the marker carries the verb's **base form**. The engine
conjugates it to match the pronoun set's grammatical number:

- `{v:be}` → "is" (singular) / "are" (plural)
- `{v:have}` → "has" / "have"
- `{v:walk}` → "walks" / "walk"

A built-in irregular-verb table covers be, have, do, go, was/were, etc.; regular verbs use
an `+s` / bare fallback. `{V:be}` capitalizes (casing rule).

### Escaping

`\{` produces a literal `{` for stories that genuinely use braces.

### Worked example

Source:

```
{Name} brushed {pos} {hair color} hair back. "{Subj} {v:be} ready," {subj} said to {self}.
```

Reader chooses *Robin / they-them / auburn*:

```
Robin brushed their auburn hair back. "They are ready," they said to themself.
```

---

## Engine module breakdown

Pure TypeScript, no UI dependencies. Files kept small and single-purpose:

- **`parser.ts`** — `parse(text) → { tokens: Token[], manifest, warnings }`.
  Tokenizes into literal-text and typed-marker segments (`field` / `pronoun-role` /
  `verb`), each carrying its casing and (for verbs) base form. The **manifest** lists the
  distinct custom fields discovered, so the UI knows which inputs to render. Malformed
  markers become warnings, not crashes.
- **`pronouns.ts`** — `PronounSet` type and presets (she/he/they), plus custom-set support.
  Each set carries the five role forms + a grammatical `number: "singular" | "plural"`.
- **`conjugate.ts`** — irregular-verb table + regular `+s`/bare fallback. Isolated for easy
  testing and extension.
- **`render.ts`** — `render(tokens, values) → { text, missing }`. Walks tokens, substitutes
  each, applies casing, conjugates verbs against `pronounSet.number`. Reports **missing**
  field values so the UI can flag them (rather than leaking raw `{markers}`).

Reader-supplied data:

```ts
type Values = {
  fields: Record<string, string>;   // "name" -> "Robin"
  pronounSet: PronounSet;            // { subj, obj, pos, posp, self, number }
};
```

---

## UI — guided steps (non-linear)

A 3-step guided flow with a **clickable step bar** (any step reachable at any time):

1. **① Story** — reader pastes a story containing `{markers}` (or picks a bundled sample).
   For authors, this step offers a marker cheat-sheet. The engine scans the text and builds
   the field manifest.
2. **② Values** — auto-rendered inputs for every discovered field, plus a pronoun-set
   selector (presets + custom + saved sets). Empty/missing fields are flagged inline.
3. **③ Read & export** — the rendered result, **updating live** as values or story change
   (tight author iteration loop). Copy / download actions live here.

Responsive: works on mobile (steps are full-width one at a time) and desktop.

---

## Persistence & export (all `localStorage` + JSON files)

- **Auto-save current work** — story + values + chosen pronoun set persist across refresh.
- **Named profiles** — a profile = a saved, named value-set (all custom fields + a pronoun
  set), e.g. *"Robin (they/them, auburn)"*. A reader applies a profile to any pasted story
  instantly and switches profiles to re-render. Profiles **export/import as JSON** — the
  no-account way to back up and share a character.
- **Custom pronoun sets** — define and save non-preset sets (ze/zir, etc.) for reuse;
  available in the step-2 selector.
- **Copy + download** — copy rendered result to clipboard; download as `.txt`.

---

## Error handling

- Malformed/unknown markers → surfaced as non-fatal warnings in the UI, never crashes.
- Missing field values → flagged inline in step 2 and listed at the result step; the raw
  marker is shown distinctly rather than silently emitted.
- Unknown verb base forms → fall back to regular `+s`/bare conjugation (still readable).
- `localStorage` unavailable/full → degrade gracefully to in-memory session with a notice.

## Testing

- **Engine** is the primary test target (pure functions): parser tokenization & manifest,
  casing rules, each pronoun role across sets, verb conjugation (irregular + regular,
  singular + plural), escaping, missing-value reporting. Test-driven.
- **UI** smoke tests for the step flow, profile save/apply, and export/import round-trip.

## Build sequence (high level)

1. Engine: `parser` → `pronouns` → `conjugate` → `render`, TDD, with the worked example as
   an integration test.
2. UI shell: Vite + React scaffold, 3-step navigation.
3. Wire engine into steps 1–3 with live preview.
4. Persistence: auto-save, profiles, custom pronoun sets.
5. Export: copy, download, profile JSON import/export.
