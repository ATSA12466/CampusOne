import type {
  SocialPost,
  SocialReply,
  SocialReaction,
  SocialConcern,
  MessageRecord,
  PrivateConversation,
} from "./social";
import type { ProfilePreferences } from "./profile";
import type { TimetableSession } from "./productivity";
import type { PersonalPlan } from "./schedule";
import type { StudyNote, GradeEntry } from "./academic-tools";
import type { PhotoRecord } from "./photo-records";
import type { ListingEnquiry } from "./listings";
import type { ServiceOptions } from "./service-contracts";
export interface WorkspaceMap {
  communityPosts: SocialPost;
  replies: SocialReply;
  reactions: SocialReaction;
  concerns: SocialConcern;
  messages: MessageRecord;
  conversations: PrivateConversation;
  profile: ProfilePreferences;
  sessions: TimetableSession;
  plans: PersonalPlan;
  notes: StudyNote;
  grades: GradeEntry;
  marketPosts: PhotoRecord;
  reports: PhotoRecord;
  enquiries: ListingEnquiry;
}
export type WorkspaceCollection = keyof WorkspaceMap;
export interface WorkspaceService {
  readonly source: "demo" | "api";
  list<K extends WorkspaceCollection>(
    collection: K,
    options?: ServiceOptions,
  ): Promise<WorkspaceMap[K][]>;
  put<K extends WorkspaceCollection>(
    collection: K,
    item: WorkspaceMap[K],
    options?: ServiceOptions,
  ): Promise<{ persisted: boolean }>;
  remove<K extends WorkspaceCollection>(
    collection: K,
    id: string,
    options?: ServiceOptions,
  ): Promise<{ persisted: boolean }>;
}
