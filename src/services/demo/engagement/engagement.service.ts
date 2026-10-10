import { announcements, campaigns, clubs, events, memberships, opportunities } from "@/data/demo/engagement/clubs";
import { initialStudentRequests, representatives, srcProjects } from "@/data/demo/engagement/src-office";

export const engagementService = {
  listClubs: () => clubs,
  listMemberships: () => memberships,
  listAnnouncements: () => announcements,
  listEvents: () => events,
  listOpportunities: () => opportunities,
  listCampaigns: () => campaigns,
  listRepresentatives: () => representatives,
  listSrcProjects: () => srcProjects,
  listInitialStudentRequests: () => initialStudentRequests,
  getClubById: (id: string) => clubs.find((club) => club.id === id),
};
