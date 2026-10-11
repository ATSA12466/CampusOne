import type { LostFoundReport } from "@/types";
const names = [
  "Blue water bottle",
  "Plain grey headphones case",
  "Yellow notebook",
  "Black umbrella",
  "Calculator pouch",
  "Small canvas tote",
  "Green keyring",
  "Charging cable",
  "Unmarked pencil case",
  "Sports cap",
];
export const extraReports: LostFoundReport[] = names.map((item, n) => ({
  id: `lf${n + 3}`,
  item,
  type: n % 2 ? "found" : "lost",
  location: [
    "Library entrance",
    "Student courtyard",
    "Lecture block",
    "Campus café",
  ][n % 4],
  date: `2026-10-${String(n + 1).padStart(2, "0")}`,
  status: n === 9 ? "claimed" : "open",
}));
