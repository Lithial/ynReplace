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
