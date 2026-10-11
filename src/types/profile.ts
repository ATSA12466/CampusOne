export interface ProfilePreferences {
  id: string;
  name: string;
  programme: string;
  level: string;
  bio: string;
  interests: string;
  visibility: "private" | "campus-preview";
  showProgramme: "yes" | "no";
  photo?: string;
}
