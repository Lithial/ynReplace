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
