import type { UserProfile, UserRole } from "./common";
import type { CampusMedia, ProcessedImage } from "./media";
export type AuthSource = "demo" | "api";
export type AuthPreview = "error" | "slow";
export interface AuthOptions {
  signal?: AbortSignal;
}
export interface SignInRequest {
  email: string;
  password: string;
  role?: UserRole;
}
export interface RegistrationRequest {
  name: string;
  email: string;
  password: string;
}
export interface AuthSession {
  user: UserProfile;
  source: AuthSource;
}
export interface ResetResult {
  delivery: "preview" | "requested";
}
export interface AuthService {
  readonly source: AuthSource;
  signIn: (input: SignInRequest, options?: AuthOptions) => Promise<AuthSession>;
  register: (input: RegistrationRequest, options?: AuthOptions) => Promise<AuthSession>;
  requestReset: (email: string, options?: AuthOptions) => Promise<ResetResult>;
  session: (options?: AuthOptions) => Promise<AuthSession | null>;
  signOut: (options?: AuthOptions) => Promise<void>;
}
export interface ProfileSetup {
  name: string;
  programme: string;
  level: string;
  interests: string[];
  portrait: "initials" | "ama" | "kojo";
}
export interface OnboardingService {
  personalizeDemo: (user: UserProfile | null, preferences: ProfileSetup) => UserProfile;
}
export interface LocalPhotoService {
  create: (photo: ProcessedImage, name: string) => CampusMedia;
  release: () => void;
}
export interface StoredAuth {
  user: UserProfile | null;
  role: UserRole;
  source: AuthSource;
  remember: boolean;
}
