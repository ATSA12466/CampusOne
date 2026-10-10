import type {
  Announcement,
  Campaign,
  Club,
  ClubMembership,
  EventItem,
  Opportunity,
  Representative,
  SRCProject,
  StudentRequest,
} from "./engagement";
import type { Course, LearningResource } from "./academics";
import type { CommunityPost, Conversation, NotificationItem } from "./community";
import type { FeaturedContentItem } from "./home";
import type { AccommodationListing, LostFoundReport, MarketplaceListing, MediaItem } from "./life";
import type { TaskItem, TimetableSession } from "./productivity";
import type { UserProfile, UserRole } from "./common";

// Compatibility contracts for current screens; new screens use the async catalog.
export interface AcademicsReadService {
  listCourses: () => Course[];
  listResources: () => LearningResource[];
  getResourceById: (id: string) => LearningResource | undefined;
}
export interface CommunityReadService {
  listPosts: () => CommunityPost[];
  listNotifications: () => NotificationItem[];
  listConversations: () => Conversation[];
}
export interface EngagementReadService {
  listClubs: () => Club[];
  listMemberships: () => ClubMembership[];
  listAnnouncements: () => Announcement[];
  listEvents: () => EventItem[];
  listOpportunities: () => Opportunity[];
  listCampaigns: () => Campaign[];
  listRepresentatives: () => Representative[];
  listSrcProjects: () => SRCProject[];
  listInitialStudentRequests: () => StudentRequest[];
  getClubById: (id: string) => Club | undefined;
}
export interface HomeReadService {
  listFeaturedContent: () => FeaturedContentItem[];
}
export interface LifeReadService {
  listMarketplace: () => MarketplaceListing[];
  listLostFound: () => LostFoundReport[];
  listAccommodation: () => AccommodationListing[];
}
export interface MediaReadService {
  listMedia: () => MediaItem[];
}
export interface ProductivityReadService {
  listInitialTasks: () => TaskItem[];
  listTimetableSessions: () => TimetableSession[];
}
export interface DemoAuthService {
  initialUser: () => UserProfile;
  signInByRole: (role: UserRole) => UserProfile;
}

export interface CollectionMap {
  clubs: Club;
  events: EventItem;
  opportunities: Opportunity;
  accommodation: AccommodationListing;
  marketplace: MarketplaceListing;
  resources: LearningResource;
  courses: Course;
  posts: CommunityPost;
  conversations: Conversation;
  notifications: NotificationItem;
  media: MediaItem;
  announcements: Announcement;
  timetable: TimetableSession;
  representatives: Representative;
  projects: SRCProject;
  campaigns: Campaign;
  lostFound: LostFoundReport;
}
export type CollectionName = keyof CollectionMap;
export interface ListQuery extends ServiceOptions {
  search?: string;
  category?: string;
  sort?: "title" | "newest";
  page?: number;
  pageSize?: number;
}
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
export interface ServiceOptions {
  signal?: AbortSignal;
  headers?: HeadersInit;
}
export interface CatalogService {
  list<K extends CollectionName>(collection: K, query?: ListQuery): Promise<Page<CollectionMap[K]>>;
  get<K extends CollectionName>(
    collection: K,
    id: string,
    options?: ServiceOptions,
  ): Promise<CollectionMap[K] | null>;
}
