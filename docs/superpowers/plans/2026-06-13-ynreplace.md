# ynReplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, client-side web app that renders self-insert stories — swapping `{markers}` for a reader's chosen name, physical-description fields, and a pronoun set, with correct pronoun forms and verb agreement.

**Architecture:** A pure, framework-agnostic TypeScript **engine** (parse → resolve → render) with zero UI/DOM/storage dependencies, wrapped by a thin **React UI** of three guided, non-linear steps (Story → Values → Read & export). All data persists in `localStorage`; profiles import/export as JSON. No backend, no accounts.

**Tech Stack:** Vite + React 19 + TypeScript, Vitest + Testing Library for tests, Biome (format/lint) + fallow (code-health audit) + lefthook (git hooks) + graphify (post-commit graph), pnpm.

---

## File Structure

**Engine (pure TS — no React/DOM/storage):**
- `src/engine/types.ts` — `Casing`, `Token`, `PronounRole`, `PronounSet`, `Values`, `ParseResult`, `ParseWarning`, `RenderResult`.
- `src/engine/casing.ts` — `detectCasing(literal)` and `applyCasing(value, casing)`.
- `src/engine/pronouns.ts` — `PRESET_PRONOUNS`, `presetById`.
- `src/engine/conjugate.ts` — irregular-verb table + regular `+s`/bare fallback.
- `src/engine/parser.ts` — `parse(text) → ParseResult`.
- `src/engine/render.ts` — `render(parseResult, values) → RenderResult`.
- `src/engine/index.ts` — public re-exports.

**Storage (browser persistence):**
- `src/storage/autosave.ts` — `loadSession`/`saveSession` (current story + values).
- `src/storage/profiles.ts` — `Profile`, CRUD, `exportProfile`/`importProfile` (JSON).

**UI (React):**
- `src/App.tsx` — step state, autosave wiring, engine glue.
- `src/components/StepBar.tsx` — clickable 3-step nav.
- `src/steps/StoryStep.tsx` — paste/sample + marker cheat-sheet.
- `src/steps/ValuesStep.tsx` — auto-rendered field inputs + missing-field flags.
- `src/components/PronounSetSelector.tsx` — presets + custom set editor.
- `src/steps/ResultStep.tsx` — live render, copy, download `.txt`.
- `src/components/ProfileBar.tsx` — save/apply/delete/export/import profiles.
- `src/sampleStory.ts` — one bundled sample story.
- `src/main.tsx`, `index.html`, `src/styles.css`.

**Config/scaffold:** `package.json`, `tsconfig.json`, `vite.config.ts`, `src/test-setup.ts`, `biome.json`, `.fallowrc.json`, `.graphifyignore`, `lefthook.yml`.

**Reserved field names:** `subj`, `obj`, `pos`, `posp`, `self` are pronoun roles; `v:*` is a verb. A custom field cannot use these exact names (documented in the cheat-sheet).

---

### Task 0: Scaffold project + tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/test-setup.ts`, `biome.json`, `.fallowrc.json`, `.graphifyignore`, `lefthook.yml`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "ynreplace",
  "private": true,
  "type": "module",
  "version": "0.1.0",
  "packageManager": "pnpm@11.6.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "prepare": "lefthook install"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.16",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "lefthook": "^1.10.1",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 3: Create `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test-setup.ts",
  },
});
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ynReplace — personalize self-insert stories</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `src/test-setup.ts`**

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 6: Create `src/styles.css`**

```css
:root {
  font-family: system-ui, sans-serif;
  line-height: 1.5;
  color: #1c1c22;
  background: #faf9f7;
}
* { box-sizing: border-box; }
body { margin: 0; }
.app { max-width: 980px; margin: 0 auto; padding: 24px 20px 64px; }
.stepbar { display: flex; gap: 8px; align-items: center; margin-bottom: 24px; flex-wrap: wrap; }
.stepbar button { border: 1px solid #d6d3cd; background: #fff; border-radius: 999px; padding: 6px 14px; cursor: pointer; font: inherit; }
.stepbar button[aria-current="true"] { background: #2f6f4f; color: #fff; border-color: #2f6f4f; }
.story-input, .field-input { width: 100%; font: inherit; padding: 10px; border: 1px solid #d6d3cd; border-radius: 8px; background: #fff; }
.story-input { min-height: 260px; font-family: ui-monospace, monospace; }
.field-row { display: flex; gap: 10px; align-items: center; margin: 8px 0; }
.field-row label { min-width: 140px; }
.missing { background: #fff8e6; border: 1px solid #e6cf8a; padding: 8px 12px; border-radius: 8px; margin: 8px 0; }
.result { white-space: pre-wrap; background: #fff; border: 1px solid #d6d3cd; border-radius: 8px; padding: 16px; min-height: 200px; }
.result mark { background: #ffe0e0; }
.row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
button.primary { background: #2f6f4f; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; cursor: pointer; font: inherit; }
button.ghost { background: #fff; border: 1px solid #d6d3cd; border-radius: 8px; padding: 8px 16px; cursor: pointer; font: inherit; }
.cheat { font-size: 13px; background: #f1efe9; border-radius: 8px; padding: 12px; }
.cheat code { background: #fff; padding: 1px 4px; border-radius: 4px; }
```

- [ ] **Step 7: Create placeholder `src/App.tsx`**

```tsx
export default function App() {
  return <div className="app">ynReplace</div>;
}
```

- [ ] **Step 8: Create `src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 9: Create `biome.json`** (mirrors collosium)

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.16/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": true, "includes": ["**", "!.fallowrc.json", "!**/graphify-out"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": { "enabled": true, "domains": { "react": "recommended" }, "rules": { "recommended": true } },
  "javascript": { "formatter": { "quoteStyle": "double" } },
  "assist": { "enabled": true, "actions": { "source": { "organizeImports": "on" } } }
}
```

- [ ] **Step 10: Create `.fallowrc.json`**

```json
{
  "$schema": "https://raw.githubusercontent.com/fallow-rs/fallow/main/schema.json",
  "entry": ["src/main.tsx"],
  "duplicates": { "minOccurrences": 3 },
  "ignorePatterns": ["scripts/**"],
  "rules": { "unused-files": "error", "unused-exports": "warn", "unused-types": "warn" }
}
```

- [ ] **Step 11: Create `.graphifyignore`**

```
# Files excluded from the graphify knowledge graph (still tracked in git).
public/favicon.svg
README.md
```

- [ ] **Step 12: Create `lefthook.yml`** (mirrors collosium)

```yaml
pre-commit:
    parallel: false
    jobs:
        - name: biome
          glob: "*.{ts,tsx,js,jsx,json,jsonc,css}"
          run: pnpm exec biome check --write --no-errors-on-unmatched {staged_files}
          stage_fixed: true
        - name: fallow-audit
          run: fallow audit
pre-push:
    parallel: true
    jobs:
        - name: typecheck
          run: pnpm run typecheck
```

- [ ] **Step 13: Install dependencies and hooks**

Run: `pnpm install`
Expected: dependencies install; `prepare` runs `lefthook install` printing `sync hooks: ✔️ (pre-commit, pre-push)`.

- [ ] **Step 14: Install graphify post-commit hook**

Run: `graphify hook install`
Expected: confirms a post-commit hook installed. (If `graphify` is not on PATH, skip and note it — it is a nice-to-have, not required for the build.)

- [ ] **Step 15: Verify dev server and test runner boot**

Run: `pnpm run typecheck && pnpm test`
Expected: typecheck passes; Vitest reports "No test files found" (exit 0) — that is fine at this stage.

- [ ] **Step 16: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite+React+TS project with biome/fallow/lefthook"
```

---

### Task 1: Engine types + casing

**Files:**
- Create: `src/engine/types.ts`
- Create: `src/engine/casing.ts`
- Test: `src/engine/casing.test.ts`

- [ ] **Step 1: Create `src/engine/types.ts`**

```ts
export type Casing = "lower" | "title" | "upper";

export type PronounRole = "subj" | "obj" | "pos" | "posp" | "self";

export type Token =
  | { kind: "text"; value: string }
  | { kind: "field"; name: string; casing: Casing; raw: string }
  | { kind: "pronoun"; role: PronounRole; casing: Casing; raw: string }
  | { kind: "verb"; base: string; casing: Casing; raw: string };

export interface PronounSet {
  id: string;
  label: string;
  subj: string;
  obj: string;
  pos: string;
  posp: string;
  self: string;
  number: "singular" | "plural";
}

export interface Values {
  fields: Record<string, string>;
  pronounSet: PronounSet;
}

export interface ParseWarning {
  raw: string;
  message: string;
}

export interface ParseResult {
  tokens: Token[];
  fields: string[];
  warnings: ParseWarning[];
}

export interface RenderResult {
  text: string;
  missing: string[];
}
```

- [ ] **Step 2: Write failing test `src/engine/casing.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { applyCasing, detectCasing } from "./casing";

describe("detectCasing", () => {
  it("lowercases by default", () => {
    expect(detectCasing("subj")).toBe("lower");
    expect(detectCasing("hair color")).toBe("lower");
  });
  it("detects title case from a leading capital", () => {
    expect(detectCasing("Subj")).toBe("title");
    expect(detectCasing("Hair color")).toBe("title");
  });
  it("detects upper case when all letters are capital and length > 1", () => {
    expect(detectCasing("NAME")).toBe("upper");
  });
  it("treats a single capital letter as title, not upper", () => {
    expect(detectCasing("I")).toBe("title");
  });
});

describe("applyCasing", () => {
  it("lower leaves the value untouched (respects user input)", () => {
    expect(applyCasing("they", "lower")).toBe("they");
    expect(applyCasing("Robin", "lower")).toBe("Robin");
  });
  it("title capitalizes the first character only", () => {
    expect(applyCasing("they", "title")).toBe("They");
    expect(applyCasing("robin", "title")).toBe("Robin");
  });
  it("upper uppercases the whole value", () => {
    expect(applyCasing("they", "upper")).toBe("THEY");
  });
  it("handles empty strings safely", () => {
    expect(applyCasing("", "title")).toBe("");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test -- casing`
Expected: FAIL — `Cannot find module './casing'`.

- [ ] **Step 4: Create `src/engine/casing.ts`**

```ts
import type { Casing } from "./types";

export function detectCasing(literal: string): Casing {
  const letters = literal.replace(/[^a-zA-Z]/g, "");
  if (letters.length === 0) return "lower";
  const isUpper = letters === letters.toUpperCase();
  if (isUpper && letters.length > 1) return "upper";
  const first = literal.match(/[a-zA-Z]/);
  if (first && first[0] === first[0].toUpperCase()) return "title";
  return "lower";
}

export function applyCasing(value: string, casing: Casing): string {
  if (value.length === 0) return value;
  switch (casing) {
    case "lower":
      return value;
    case "title":
      return value[0].toUpperCase() + value.slice(1);
    case "upper":
      return value.toUpperCase();
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- casing`
Expected: PASS (all cases green).

- [ ] **Step 6: Commit**

```bash
git add src/engine/types.ts src/engine/casing.ts src/engine/casing.test.ts
git commit -m "feat(engine): add token/value types and casing helpers"
```

---

### Task 2: Pronoun presets

**Files:**
- Create: `src/engine/pronouns.ts`
- Test: `src/engine/pronouns.test.ts`

- [ ] **Step 1: Write failing test `src/engine/pronouns.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { PRESET_PRONOUNS, presetById } from "./pronouns";

describe("PRESET_PRONOUNS", () => {
  it("includes she/her, he/him, they/them", () => {
    expect(PRESET_PRONOUNS.map((p) => p.id)).toEqual(["she", "he", "they"]);
  });
  it("marks they/them as plural for verb agreement, others singular", () => {
    expect(presetById("they")?.number).toBe("plural");
    expect(presetById("she")?.number).toBe("singular");
    expect(presetById("he")?.number).toBe("singular");
  });
  it("has all five roles for they/them", () => {
    const they = presetById("they");
    expect(they).toMatchObject({
      subj: "they", obj: "them", pos: "their", posp: "theirs", self: "themself",
    });
  });
  it("returns undefined for an unknown id", () => {
    expect(presetById("nope")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- pronouns`
Expected: FAIL — `Cannot find module './pronouns'`.

- [ ] **Step 3: Create `src/engine/pronouns.ts`**

```ts
import type { PronounSet } from "./types";

export const PRESET_PRONOUNS: PronounSet[] = [
  { id: "she", label: "she/her", subj: "she", obj: "her", pos: "her", posp: "hers", self: "herself", number: "singular" },
  { id: "he", label: "he/him", subj: "he", obj: "him", pos: "his", posp: "his", self: "himself", number: "singular" },
  { id: "they", label: "they/them", subj: "they", obj: "them", pos: "their", posp: "theirs", self: "themself", number: "plural" },
];

export function presetById(id: string): PronounSet | undefined {
  return PRESET_PRONOUNS.find((p) => p.id === id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- pronouns`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/pronouns.ts src/engine/pronouns.test.ts
git commit -m "feat(engine): add pronoun presets"
```

---

### Task 3: Verb conjugation

**Files:**
- Create: `src/engine/conjugate.ts`
- Test: `src/engine/conjugate.test.ts`

- [ ] **Step 1: Write failing test `src/engine/conjugate.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { conjugate } from "./conjugate";

describe("conjugate", () => {
  it("conjugates irregular 'be'", () => {
    expect(conjugate("be", "singular")).toBe("is");
    expect(conjugate("be", "plural")).toBe("are");
  });
  it("conjugates irregular 'have' and 'do'", () => {
    expect(conjugate("have", "singular")).toBe("has");
    expect(conjugate("have", "plural")).toBe("have");
    expect(conjugate("do", "singular")).toBe("does");
  });
  it("conjugates past-tense 'was'", () => {
    expect(conjugate("was", "singular")).toBe("was");
    expect(conjugate("was", "plural")).toBe("were");
  });
  it("adds -s for regular verbs in the singular", () => {
    expect(conjugate("walk", "singular")).toBe("walks");
    expect(conjugate("walk", "plural")).toBe("walk");
  });
  it("adds -es after sibilant endings", () => {
    expect(conjugate("kiss", "singular")).toBe("kisses");
    expect(conjugate("focus", "singular")).toBe("focuses");
    expect(conjugate("watch", "singular")).toBe("watches");
  });
  it("turns consonant+y into -ies", () => {
    expect(conjugate("carry", "singular")).toBe("carries");
  });
  it("keeps vowel+y as +s", () => {
    expect(conjugate("play", "singular")).toBe("plays");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- conjugate`
Expected: FAIL — `Cannot find module './conjugate'`.

- [ ] **Step 3: Create `src/engine/conjugate.ts`**

```ts
const IRREGULAR: Record<string, { singular: string; plural: string }> = {
  be: { singular: "is", plural: "are" },
  was: { singular: "was", plural: "were" },
  have: { singular: "has", plural: "have" },
  do: { singular: "does", plural: "do" },
  go: { singular: "goes", plural: "go" },
};

function thirdPersonSingular(base: string): string {
  if (/(s|x|z|ch|sh)$/.test(base)) return `${base}es`;
  if (/[^aeiou]y$/.test(base)) return `${base.slice(0, -1)}ies`;
  return `${base}s`;
}

export function conjugate(base: string, number: "singular" | "plural"): string {
  const irregular = IRREGULAR[base];
  if (irregular) return number === "singular" ? irregular.singular : irregular.plural;
  return number === "singular" ? thirdPersonSingular(base) : base;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- conjugate`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/conjugate.ts src/engine/conjugate.test.ts
git commit -m "feat(engine): add verb conjugation"
```

---

### Task 4: Parser

**Files:**
- Create: `src/engine/parser.ts`
- Test: `src/engine/parser.test.ts`

- [ ] **Step 1: Write failing test `src/engine/parser.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { parse } from "./parser";

describe("parse", () => {
  it("returns a single text token for plain text", () => {
    const r = parse("hello world");
    expect(r.tokens).toEqual([{ kind: "text", value: "hello world" }]);
    expect(r.fields).toEqual([]);
  });

  it("parses a field marker and records it in the manifest", () => {
    const r = parse("Hi {name}!");
    expect(r.tokens).toEqual([
      { kind: "text", value: "Hi " },
      { kind: "field", name: "name", casing: "lower", raw: "{name}" },
      { kind: "text", value: "!" },
    ]);
    expect(r.fields).toEqual(["name"]);
  });

  it("normalizes field name to lowercase but keeps casing from the marker", () => {
    const r = parse("{Name} {NAME}");
    expect(r.tokens[0]).toMatchObject({ kind: "field", name: "name", casing: "title" });
    expect(r.tokens[2]).toMatchObject({ kind: "field", name: "name", casing: "upper" });
    expect(r.fields).toEqual(["name"]);
  });

  it("lists distinct fields in first-seen order", () => {
    const r = parse("{name} {hair color} {name}");
    expect(r.fields).toEqual(["name", "hair color"]);
  });

  it("parses pronoun roles", () => {
    const r = parse("{subj} {Obj} {pos} {posp} {self}");
    expect(r.tokens.filter((t) => t.kind === "pronoun").map((t) => (t as { role: string }).role)).toEqual([
      "subj", "obj", "pos", "posp", "self",
    ]);
    expect(r.tokens[2]).toMatchObject({ kind: "pronoun", role: "obj", casing: "title" });
    expect(r.fields).toEqual([]);
  });

  it("parses verb markers with base form and casing", () => {
    const r = parse("{v:be} {V:have}");
    expect(r.tokens[0]).toMatchObject({ kind: "verb", base: "be", casing: "lower" });
    expect(r.tokens[2]).toMatchObject({ kind: "verb", base: "have", casing: "title" });
  });

  it("unescapes \\{ into a literal brace", () => {
    const r = parse("a \\{ b");
    expect(r.tokens).toEqual([{ kind: "text", value: "a { b" }]);
  });

  it("emits a warning for an empty marker and keeps it as literal text", () => {
    const r = parse("x {} y");
    expect(r.warnings).toHaveLength(1);
    expect(r.tokens).toEqual([{ kind: "text", value: "x {} y" }]);
  });

  it("trims whitespace inside markers", () => {
    const r = parse("{ name }");
    expect(r.tokens[0]).toMatchObject({ kind: "field", name: "name" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- parser`
Expected: FAIL — `Cannot find module './parser'`.

- [ ] **Step 3: Create `src/engine/parser.ts`**

```ts
import { detectCasing } from "./casing";
import type { ParseResult, ParseWarning, PronounRole, Token } from "./types";

const PRONOUN_ROLES: PronounRole[] = ["subj", "obj", "pos", "posp", "self"];
const MARKER = /\\\{|\{([^}]*)\}/g;

export function parse(text: string): ParseResult {
  const tokens: Token[] = [];
  const fields: string[] = [];
  const warnings: ParseWarning[] = [];
  let lastIndex = 0;
  let buffer = "";

  const flush = () => {
    if (buffer.length > 0) {
      tokens.push({ kind: "text", value: buffer });
      buffer = "";
    }
  };

  for (const match of text.matchAll(MARKER)) {
    const index = match.index ?? 0;
    buffer += text.slice(lastIndex, index);
    lastIndex = index + match[0].length;

    if (match[0] === "\\{") {
      buffer += "{";
      continue;
    }

    const inner = (match[1] ?? "").trim();
    const raw = match[0];

    if (inner.length === 0) {
      warnings.push({ raw, message: "Empty marker" });
      buffer += raw;
      continue;
    }

    const verb = inner.match(/^([vV]):(.+)$/);
    if (verb) {
      flush();
      tokens.push({
        kind: "verb",
        base: verb[2].trim().toLowerCase(),
        casing: verb[1] === "V" ? "title" : "lower",
        raw,
      });
      continue;
    }

    const lower = inner.toLowerCase();
    if (PRONOUN_ROLES.includes(lower as PronounRole)) {
      flush();
      tokens.push({ kind: "pronoun", role: lower as PronounRole, casing: detectCasing(inner), raw });
      continue;
    }

    flush();
    if (!fields.includes(lower)) fields.push(lower);
    tokens.push({ kind: "field", name: lower, casing: detectCasing(inner), raw });
  }

  buffer += text.slice(lastIndex);
  flush();

  return { tokens, fields, warnings };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- parser`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/parser.ts src/engine/parser.test.ts
git commit -m "feat(engine): add marker parser"
```

---

### Task 5: Render + public engine API

**Files:**
- Create: `src/engine/render.ts`
- Create: `src/engine/index.ts`
- Test: `src/engine/render.test.ts`

- [ ] **Step 1: Write failing test `src/engine/render.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { parse } from "./parser";
import { presetById } from "./pronouns";
import { render } from "./render";
import type { PronounSet, Values } from "./types";

const they = presetById("they") as PronounSet;
const she = presetById("she") as PronounSet;

function values(fields: Record<string, string>, set: PronounSet): Values {
  return { fields, pronounSet: set };
}

describe("render", () => {
  it("renders the worked example for Robin / they-them / auburn", () => {
    const story =
      '{Name} brushed {pos} {hair color} hair back. "{Subj} {v:be} ready," {subj} said to {self}.';
    const r = render(parse(story), values({ name: "Robin", "hair color": "auburn" }, they));
    expect(r.text).toBe(
      'Robin brushed their auburn hair back. "They are ready," they said to themself.',
    );
    expect(r.missing).toEqual([]);
  });

  it("conjugates verbs to singular for she/her", () => {
    const r = render(parse("{Subj} {v:be} here and {subj} {v:walk}."), values({}, she));
    expect(r.text).toBe("She is here and she walks.");
  });

  it("applies casing to pronouns and fields", () => {
    const r = render(parse("{NAME} / {Name} / {name}"), values({ name: "robin" }, she));
    expect(r.text).toBe("ROBIN / Robin / robin");
  });

  it("reports missing fields and leaves the raw marker in place", () => {
    const r = render(parse("Hi {name}, your {item}."), values({ name: "Sam" }, she));
    expect(r.text).toBe("Hi Sam, your {item}.");
    expect(r.missing).toEqual(["item"]);
  });

  it("treats an empty-string field value as missing", () => {
    const r = render(parse("{name}"), values({ name: "" }, she));
    expect(r.missing).toEqual(["name"]);
    expect(r.text).toBe("{name}");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- render`
Expected: FAIL — `Cannot find module './render'`.

- [ ] **Step 3: Create `src/engine/render.ts`**

```ts
import { applyCasing } from "./casing";
import { conjugate } from "./conjugate";
import type { ParseResult, RenderResult, Values } from "./types";

export function render(parsed: ParseResult, values: Values): RenderResult {
  const missing: string[] = [];
  let text = "";

  for (const token of parsed.tokens) {
    switch (token.kind) {
      case "text":
        text += token.value;
        break;
      case "field": {
        const value = values.fields[token.name];
        if (value === undefined || value === "") {
          if (!missing.includes(token.name)) missing.push(token.name);
          text += token.raw;
        } else {
          text += applyCasing(value, token.casing);
        }
        break;
      }
      case "pronoun":
        text += applyCasing(values.pronounSet[token.role], token.casing);
        break;
      case "verb":
        text += applyCasing(conjugate(token.base, values.pronounSet.number), token.casing);
        break;
    }
  }

  return { text, missing };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- render`
Expected: PASS.

- [ ] **Step 5: Create `src/engine/index.ts`**

```ts
export { applyCasing, detectCasing } from "./casing";
export { conjugate } from "./conjugate";
export { parse } from "./parser";
export { PRESET_PRONOUNS, presetById } from "./pronouns";
export { render } from "./render";
export type {
  Casing,
  ParseResult,
  ParseWarning,
  PronounRole,
  PronounSet,
  RenderResult,
  Token,
  Values,
} from "./types";
```

- [ ] **Step 6: Run full engine suite + typecheck**

Run: `pnpm test && pnpm run typecheck`
Expected: all engine tests PASS; typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add src/engine/render.ts src/engine/index.ts src/engine/render.test.ts
git commit -m "feat(engine): add render + public engine API"
```

---

### Task 6: Storage (autosave + profiles)

**Files:**
- Create: `src/storage/autosave.ts`
- Create: `src/storage/profiles.ts`
- Test: `src/storage/profiles.test.ts`

- [ ] **Step 1: Write failing test `src/storage/profiles.test.ts`**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { presetById } from "../engine/pronouns";
import type { PronounSet } from "../engine/types";
import { exportProfile, importProfile, loadProfiles, saveProfiles } from "./profiles";

const she = presetById("she") as PronounSet;

beforeEach(() => localStorage.clear());

describe("profiles", () => {
  it("returns an empty list when nothing is stored", () => {
    expect(loadProfiles()).toEqual([]);
  });

  it("round-trips profiles through localStorage", () => {
    const profile = { id: "p1", name: "Robin", fields: { name: "Robin" }, pronounSet: she };
    saveProfiles([profile]);
    expect(loadProfiles()).toEqual([profile]);
  });

  it("exports a profile to JSON and imports it back", () => {
    const profile = { id: "p1", name: "Robin", fields: { name: "Robin" }, pronounSet: she };
    const json = exportProfile(profile);
    const imported = importProfile(json);
    expect(imported).toEqual(profile);
  });

  it("throws on malformed import JSON", () => {
    expect(() => importProfile("{not valid")).toThrow();
    expect(() => importProfile('{"name":"x"}')).toThrow(/profile/i);
  });

  it("ignores corrupt stored data and returns an empty list", () => {
    localStorage.setItem("ynreplace.profiles", "{broken");
    expect(loadProfiles()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- profiles`
Expected: FAIL — `Cannot find module './profiles'`.

- [ ] **Step 3: Create `src/storage/profiles.ts`**

```ts
import type { PronounSet } from "../engine/types";

export interface Profile {
  id: string;
  name: string;
  fields: Record<string, string>;
  pronounSet: PronounSet;
}

const KEY = "ynreplace.profiles";

export function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Profile[]) : [];
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: Profile[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(profiles));
  } catch {
    // localStorage unavailable/full — degrade silently to in-memory only.
  }
}

export function exportProfile(profile: Profile): string {
  return JSON.stringify(profile, null, 2);
}

export function importProfile(json: string): Profile {
  const parsed = JSON.parse(json);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.name !== "string" ||
    typeof parsed.fields !== "object" ||
    typeof parsed.pronounSet !== "object"
  ) {
    throw new Error("Invalid profile JSON");
  }
  return parsed as Profile;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- profiles`
Expected: PASS.

- [ ] **Step 5: Create `src/storage/autosave.ts`**

```ts
import type { PronounSet } from "../engine/types";

export interface Session {
  story: string;
  fields: Record<string, string>;
  pronounSet: PronounSet;
}

const KEY = "ynreplace.session";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.story !== "string") return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // ignore quota/availability errors
  }
}
```

- [ ] **Step 6: Run full suite + typecheck**

Run: `pnpm test && pnpm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/storage/
git commit -m "feat(storage): add autosave + profile persistence"
```

---

### Task 7: App shell + StepBar + sample story

**Files:**
- Create: `src/sampleStory.ts`
- Create: `src/components/StepBar.tsx`
- Modify: `src/App.tsx` (replace placeholder)
- Test: `src/components/StepBar.test.tsx`

- [ ] **Step 1: Create `src/sampleStory.ts`**

```ts
export const SAMPLE_STORY =
  '{Name} pushed open the café door. "{Subj} {v:be} late again," {subj} muttered, ' +
  "tucking a strand of {pos} {hair color} hair behind one ear. The barista waved {obj} over — " +
  "this regular table was practically {posp}. {Subj} caught {self} smiling.";
```

- [ ] **Step 2: Write failing test `src/components/StepBar.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StepBar } from "./StepBar";

describe("StepBar", () => {
  it("marks the current step and lets you jump to another", async () => {
    const onChange = vi.fn();
    render(<StepBar current={1} onChange={onChange} />);
    expect(screen.getByRole("button", { name: /Values/ })).toHaveAttribute("aria-current", "true");
    await userEvent.click(screen.getByRole("button", { name: /Read/ }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test -- StepBar`
Expected: FAIL — `Cannot find module './StepBar'`.

- [ ] **Step 4: Create `src/components/StepBar.tsx`**

```tsx
const STEPS = ["Story", "Values", "Read & export"];

export function StepBar({ current, onChange }: { current: number; onChange: (step: number) => void }) {
  return (
    <nav className="stepbar">
      {STEPS.map((label, index) => (
        <button
          key={label}
          type="button"
          aria-current={index === current}
          onClick={() => onChange(index)}
        >
          {index + 1}. {label}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- StepBar`
Expected: PASS.

- [ ] **Step 6: Replace `src/App.tsx` with the shell**

```tsx
import { useEffect, useMemo, useState } from "react";
import { StepBar } from "./components/StepBar";
import { parse, presetById } from "./engine";
import type { PronounSet } from "./engine";
import { ResultStep } from "./steps/ResultStep";
import { StoryStep } from "./steps/StoryStep";
import { ValuesStep } from "./steps/ValuesStep";
import { loadSession, saveSession } from "./storage/autosave";

const DEFAULT_SET = presetById("they") as PronounSet;

export default function App() {
  const saved = loadSession();
  const [step, setStep] = useState(0);
  const [story, setStory] = useState(saved?.story ?? "");
  const [fields, setFields] = useState<Record<string, string>>(saved?.fields ?? {});
  const [pronounSet, setPronounSet] = useState<PronounSet>(saved?.pronounSet ?? DEFAULT_SET);

  const parsed = useMemo(() => parse(story), [story]);

  useEffect(() => {
    saveSession({ story, fields, pronounSet });
  }, [story, fields, pronounSet]);

  return (
    <div className="app">
      <h1>ynReplace</h1>
      <StepBar current={step} onChange={setStep} />
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
```

- [ ] **Step 7: Verify typecheck fails only on the not-yet-created step modules**

Run: `pnpm run typecheck`
Expected: errors are limited to missing `./steps/StoryStep`, `./steps/ValuesStep`, `./steps/ResultStep` (created in Tasks 8–10). This confirms the shell wiring is otherwise correct. Do **not** commit yet — the next task makes it compile.

- [ ] **Step 8: Commit the parts that stand alone**

```bash
git add src/sampleStory.ts src/components/StepBar.tsx src/components/StepBar.test.tsx
git commit -m "feat(ui): add step navigation bar and sample story"
```

---

### Task 8: StoryStep

**Files:**
- Create: `src/steps/StoryStep.tsx`
- Test: `src/steps/StoryStep.test.tsx`

- [ ] **Step 1: Write failing test `src/steps/StoryStep.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StoryStep } from "./StoryStep";

describe("StoryStep", () => {
  it("edits the story text", async () => {
    const onChange = vi.fn();
    render(<StoryStep story="" onChange={onChange} onNext={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/story/i), "Hi {name}");
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0]).toContain("name");
  });

  it("loads the sample story on demand", async () => {
    const onChange = vi.fn();
    render(<StoryStep story="" onChange={onChange} onNext={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /sample/i }));
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining("{Name}"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- StoryStep`
Expected: FAIL — `Cannot find module './StoryStep'`.

- [ ] **Step 3: Create `src/steps/StoryStep.tsx`**

```tsx
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
        value={story}
        onChange={(e) => onChange(e.target.value)}
        placeholder="{Name} walked in. {Subj} {v:be} ready..."
      />
      <div className="cheat">
        <strong>Markers:</strong> <code>{"{name}"}</code> custom field ·{" "}
        <code>{"{subj}"}</code> <code>{"{obj}"}</code> <code>{"{pos}"}</code>{" "}
        <code>{"{posp}"}</code> <code>{"{self}"}</code> pronouns ·{" "}
        <code>{"{v:be}"}</code> verbs (conjugated). Capitalize the marker to capitalize output:{" "}
        <code>{"{Name}"}</code>, <code>{"{Subj}"}</code>.
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- StoryStep`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/steps/StoryStep.tsx src/steps/StoryStep.test.tsx
git commit -m "feat(ui): add story input step"
```

---

### Task 9: PronounSetSelector + ValuesStep

**Files:**
- Create: `src/components/PronounSetSelector.tsx`
- Create: `src/steps/ValuesStep.tsx`
- Test: `src/steps/ValuesStep.test.tsx`

- [ ] **Step 1: Write failing test `src/steps/ValuesStep.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { presetById } from "../engine";
import type { PronounSet } from "../engine";
import { ValuesStep } from "./ValuesStep";

const they = presetById("they") as PronounSet;

function setup(overrides: Partial<Parameters<typeof ValuesStep>[0]> = {}) {
  const props = {
    fields: ["name", "hair color"],
    values: { name: "Robin" } as Record<string, string>,
    onChangeValue: vi.fn(),
    pronounSet: they,
    onChangePronounSet: vi.fn(),
    onNext: vi.fn(),
    ...overrides,
  };
  render(<ValuesStep {...props} />);
  return props;
}

describe("ValuesStep", () => {
  it("renders an input per discovered field", () => {
    setup();
    expect(screen.getByLabelText("name")).toHaveValue("Robin");
    expect(screen.getByLabelText("hair color")).toHaveValue("");
  });

  it("calls onChangeValue when editing a field", async () => {
    const props = setup();
    await userEvent.type(screen.getByLabelText("hair color"), "auburn");
    expect(props.onChangeValue).toHaveBeenCalledWith("hair color", expect.any(String));
  });

  it("flags fields that are still empty", () => {
    setup();
    expect(screen.getByText(/hair color/)).toBeInTheDocument();
    expect(screen.getByText(/still empty/i)).toBeInTheDocument();
  });

  it("switches the pronoun preset", async () => {
    const props = setup();
    await userEvent.selectOptions(screen.getByLabelText(/pronoun/i), "she");
    expect(props.onChangePronounSet).toHaveBeenCalledWith(
      expect.objectContaining({ id: "she" }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ValuesStep`
Expected: FAIL — `Cannot find module './ValuesStep'`.

- [ ] **Step 3: Create `src/components/PronounSetSelector.tsx`**

```tsx
import { PRESET_PRONOUNS, presetById } from "../engine";
import type { PronounSet } from "../engine";

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
```

- [ ] **Step 4: Create `src/steps/ValuesStep.tsx`**

```tsx
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
      {fields.length === 0 && <p>No fields found in the story. Add some {"{markers}"} in step 1.</p>}
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
          {empty.length} field{empty.length > 1 ? "s" : ""} still empty: {empty.join(", ")}
        </p>
      )}

      <button type="button" className="primary" onClick={onNext}>
        Next: read &amp; export →
      </button>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- ValuesStep`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/PronounSetSelector.tsx src/steps/ValuesStep.tsx src/steps/ValuesStep.test.tsx
git commit -m "feat(ui): add values step with pronoun-set selector"
```

---

### Task 10: ResultStep (live render, copy, download)

**Files:**
- Create: `src/steps/ResultStep.tsx`
- Test: `src/steps/ResultStep.test.tsx`

- [ ] **Step 1: Write failing test `src/steps/ResultStep.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { parse, presetById } from "../engine";
import type { PronounSet } from "../engine";
import { ResultStep } from "./ResultStep";

const they = presetById("they") as PronounSet;

describe("ResultStep", () => {
  it("renders the personalized story live", () => {
    const parsed = parse('{Name} {v:be} here.');
    render(<ResultStep parsed={parsed} fields={{ name: "Robin" }} pronounSet={they} />);
    expect(screen.getByTestId("result")).toHaveTextContent("Robin are here.");
  });

  it("shows a copy button and a download link", () => {
    const parsed = parse("{name}");
    render(<ResultStep parsed={parsed} fields={{ name: "Robin" }} pronounSet={they} />);
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download/i })).toBeInTheDocument();
  });

  it("warns when fields are missing", () => {
    const parsed = parse("{name} {item}");
    render(<ResultStep parsed={parsed} fields={{ name: "Robin" }} pronounSet={they} />);
    expect(screen.getByText(/item/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ResultStep`
Expected: FAIL — `Cannot find module './ResultStep'`.

- [ ] **Step 3: Create `src/steps/ResultStep.tsx`**

```tsx
import { useMemo, useState } from "react";
import { render as renderStory } from "../engine";
import type { ParseResult, PronounSet } from "../engine";

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
        {result.text || <span style={{ opacity: 0.5 }}>Your personalized story appears here.</span>}
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button type="button" className="primary" onClick={copy}>
          {copied ? "Copied!" : "Copy text"}
        </button>
        <a className="ghost" href={downloadHref} download="story.txt" role="link">
          Download .txt
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ResultStep`
Expected: PASS.

- [ ] **Step 5: Full suite + typecheck (App now compiles)**

Run: `pnpm test && pnpm run typecheck`
Expected: all tests PASS; typecheck clean (the App shell from Task 7 now resolves all step imports).

- [ ] **Step 6: Commit**

```bash
git add src/steps/ResultStep.tsx src/steps/ResultStep.test.tsx
git commit -m "feat(ui): add result step with live render, copy, download"
```

---

### Task 11: ProfileBar (save / apply / delete / export / import)

**Files:**
- Create: `src/components/ProfileBar.tsx`
- Modify: `src/App.tsx` (add ProfileBar + apply handler)
- Test: `src/components/ProfileBar.test.tsx`

- [ ] **Step 1: Write failing test `src/components/ProfileBar.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { presetById } from "../engine";
import type { PronounSet } from "../engine";
import { ProfileBar } from "./ProfileBar";

const she = presetById("she") as PronounSet;

beforeEach(() => localStorage.clear());

describe("ProfileBar", () => {
  it("saves the current values as a named profile and lists it", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("Robin");
    render(<ProfileBar fields={{ name: "Robin" }} pronounSet={she} onApply={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /save current/i }));
    expect(screen.getByRole("option", { name: /Robin/ })).toBeInTheDocument();
  });

  it("applies a selected profile", async () => {
    vi.spyOn(window, "prompt").mockReturnValue("Robin");
    const onApply = vi.fn();
    render(<ProfileBar fields={{ name: "Robin" }} pronounSet={she} onApply={onApply} />);
    await userEvent.click(screen.getByRole("button", { name: /save current/i }));
    await userEvent.selectOptions(screen.getByLabelText(/profile/i), screen.getByRole("option", { name: /Robin/ }));
    await userEvent.click(screen.getByRole("button", { name: /^apply$/i }));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ fields: { name: "Robin" }, pronounSet: expect.objectContaining({ id: "she" }) }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- ProfileBar`
Expected: FAIL — `Cannot find module './ProfileBar'`.

- [ ] **Step 3: Create `src/components/ProfileBar.tsx`**

```tsx
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
      <select id="profile-select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- ProfileBar`
Expected: PASS.

- [ ] **Step 5: Wire ProfileBar into `src/App.tsx`**

Add the import near the other component imports:

```tsx
import { ProfileBar } from "./components/ProfileBar";
import type { Profile } from "./storage/profiles";
```

Add an apply handler inside the `App` component, after the `useEffect`:

```tsx
  const applyProfile = (profile: Profile) => {
    setFields(profile.fields);
    setPronounSet(profile.pronounSet);
  };
```

Render `<ProfileBar>` directly under `<StepBar ... />`:

```tsx
      <StepBar current={step} onChange={setStep} />
      <ProfileBar fields={fields} pronounSet={pronounSet} onApply={applyProfile} />
```

- [ ] **Step 6: Full suite + typecheck**

Run: `pnpm test && pnpm run typecheck`
Expected: all PASS; typecheck clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/ProfileBar.tsx src/components/ProfileBar.test.tsx src/App.tsx
git commit -m "feat(ui): add profile save/apply/export/import bar"
```

---

### Task 12: Build verification + README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Verify production build succeeds**

Run: `pnpm run build`
Expected: `tsc --noEmit` passes and `vite build` writes `dist/` with no errors.

- [ ] **Step 2: Manually smoke-test the dev server**

Run: `pnpm dev`
Then in a browser at the printed URL:
1. Step 1 → "Load sample story".
2. Step 2 → fields `name`/`hair color` appear; fill them; switch pronouns to they/them.
3. Step 3 → result reads correctly ("...they muttered...themself..."), Copy works, Download saves a `.txt`.
4. Save a profile, reload the page (autosave restores), apply the profile.
Expected: all behaviors work; no console errors. Stop the server when done.

- [ ] **Step 3: Create `README.md`**

```markdown
# ynReplace

Personalize self-insert stories in your browser. Paste a story that uses `{markers}`,
fill in your name, appearance, and pronouns, and read it back with correct pronouns and
verb agreement. Everything stays in your browser — no accounts, no server.

## Markers

- **Fields:** `{name}`, `{hair color}` — any name you choose. Capitalize the marker to
  capitalize the output: `{Name}` → "Robin", `{NAME}` → "ROBIN".
- **Pronoun roles:** `{subj}` `{obj}` `{pos}` `{posp}` `{self}` (e.g. they/them →
  they / them / their / theirs / themself). Pick a set in step 2.
- **Verbs:** `{v:be}`, `{v:walk}` — carry the base form; conjugated to match the chosen
  pronoun set (`{v:be}` → "is" or "are"). Capitalize as `{V:be}`.
- **Literal brace:** write `\{` for a literal `{`.

`subj`, `obj`, `pos`, `posp`, `self` are reserved — don't use them as field names.

## Develop

```bash
pnpm install
pnpm dev        # local dev server
pnpm test       # run the engine + UI test suite
pnpm run build  # production build to dist/ (static, deploy anywhere)
```
```

- [ ] **Step 4: Final commit**

```bash
git add README.md
git commit -m "docs: add README with marker reference and dev instructions"
```

---

## Self-Review

**Spec coverage:**
- Static client-side, no accounts → Task 0 (Vite static, `base: "./"`), no backend anywhere. ✓
- Token-swapping on pre-marked stories → parser (Task 4) + render (Task 5). ✓
- Custom user-defined fields → parser manifest + ValuesStep (Tasks 4, 9). ✓
- Full pronoun roles (5) → types + presets + parser + render (Tasks 1–5). ✓
- Verb agreement by base form → conjugate + render (Tasks 3, 5). ✓
- Casing rule → casing + parser + render (Tasks 1, 4, 5). ✓
- Escaping `\{` → parser (Task 4). ✓
- Guided non-linear steps → StepBar + App (Task 7). ✓
- Auto-save → autosave + App useEffect (Tasks 6, 7). ✓
- Named profiles + custom pronoun sets + JSON import/export → ProfileBar + PronounSetSelector + profiles storage (Tasks 6, 9, 11). ✓
- Copy + download .txt → ResultStep (Task 10). ✓
- Error handling (warnings, missing fields, storage failure) → parser warnings, render `missing`, try/catch in storage (Tasks 4, 5, 6). ✓
- Collosium tooling (biome/fallow/lefthook/graphify) → Task 0. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every command shows expected output. ✓

**Type consistency:** `PronounSet`, `Values`, `ParseResult`, `Profile`, `Session` defined once and used with identical shapes; `parse`/`render`/`conjugate`/`presetById`/`applyCasing`/`detectCasing` signatures consistent across tasks; `render` imported as `renderStory` in ResultStep to avoid clashing with React Testing Library's `render`. ✓
