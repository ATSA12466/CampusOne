import { images } from "@/config/images";
import type { UserProfile } from "@/types";

export const demoUser: UserProfile = {
  id: "user-1",
  name: "Ama Nyarko",
  avatar: images.studentAma.src,
  email: "ama.nyarko@campusone.demo",
  role: "student",
  programme: "BSc Information Technology",
  level: "Level 300",
};
