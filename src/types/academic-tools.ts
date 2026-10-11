export interface StudyNote {
  id: string;
  course: string;
  title: string;
  body: string;
  createdAt: string;
}
export interface GradeEntry {
  id: string;
  course: string;
  term: string;
  credits: number;
  points: number;
}
