// Preserve established API category identifiers while presenting readable interests.
const legacyLabels: Readonly<Record<string, string>> = {
  technology: "Technology",
  "public-speaking": "Service & leadership",
};
export function clubCategoryLabel(category: string) {
  return legacyLabels[category] ?? category;
}
