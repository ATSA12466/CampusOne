import type { Course, LearningResource } from "@/types";

export const courses: Course[] = [
  { id: "c1", code: "ITT 341", title: "Software Engineering" },
  { id: "c2", code: "ITT 315", title: "Database Systems" },
  { id: "c3", code: "ITT 351", title: "Computer Networks" },
];

export const resources: LearningResource[] = [
  {
    id: "r1",
    title: "Agile sprint planning notes",
    course: "ITT 341",
    category: "pdf",
    description: "Summary of agile planning, estimation, and retrospectives.",
    uploadedAt: "2026-10-01",
    downloadable: true,
    url: "https://example.com/resources/agile-notes.pdf",
  },
  {
    id: "r2",
    title: "Normalization walkthrough",
    course: "ITT 315",
    category: "video",
    description: "Step-by-step ERD to 3NF practice walkthrough.",
    uploadedAt: "2026-10-02",
    downloadable: false,
  },
  {
    id: "r3",
    title: "OSI model quick slides",
    course: "ITT 351",
    category: "slides",
    description: "Compact slide deck for revision before quizzes.",
    uploadedAt: "2026-10-03",
    downloadable: true,
    url: "https://example.com/resources/osi-slides.pptx",
  },
];
