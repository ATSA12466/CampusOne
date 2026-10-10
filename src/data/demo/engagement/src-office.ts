import type { Representative, SRCProject, StudentRequest } from "@/types/engagement";

export const representatives: Representative[] = [
  {
    id: "rep-1",
    name: "Nana Owusu",
    role: "SRC President",
    responsibility: "Student welfare, policy advocacy, and academic support escalation.",
  },
  {
    id: "rep-2",
    name: "Linda Boateng",
    role: "General Secretary",
    responsibility: "Communication records, request coordination, and project documentation.",
  },
];

export const srcProjects: SRCProject[] = [
  {
    id: "src-p1",
    title: "Library access extension",
    status: "in-progress",
    summary: "Extending study-space opening hours during peak revision periods.",
  },
  {
    id: "src-p2",
    title: "Internship desk launch",
    status: "planning",
    summary: "Centralized support desk connecting students to internship opportunities.",
  },
  {
    id: "src-p3",
    title: "Campus safety feedback cycle",
    status: "active",
    summary: "Collecting and tracking actionable safety issues reported by students.",
  },
];

export const initialStudentRequests: StudentRequest[] = [
  {
    id: "sr-1",
    title: "Weekend lab access",
    category: "Academic support",
    description: "Requesting supervised lab opening for final-year project teams.",
    status: "under-review",
    createdAt: "2026-10-07",
  },
];
