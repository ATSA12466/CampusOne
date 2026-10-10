export interface LearningResource {
  id: string;
  title: string;
  course: string;
  category: "pdf" | "video" | "slides" | "link";
  description: string;
  uploadedAt: string;
  downloadable: boolean;
  url?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
}
