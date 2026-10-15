import { appConfig } from "@/config/app-config";
import { apiClient } from "@/services/api/client";

export const engagementService = {
  async listClubs() {
    return (await apiClient<{ clubs: any[] }>("/engagement/clubs.json")).clubs;
  },
  async listMemberships() {
    return (await apiClient<{ memberships: any[] }>("/engagement/clubs.json")).memberships;
  },
  async listAnnouncements() {
    return (await apiClient<{ announcements: any[] }>("/engagement/announcements.json")).announcements;
  },
  async listEvents() {
    return (await apiClient<{ events: any[] }>("/engagement/events.json")).events;
  },
  async listOpportunities() {
    return (await apiClient<{ opportunities: any[] }>("/engagement/opportunities.json")).opportunities;
  },
  async getClubById(id: string) {
    const clubs = await this.listClubs();
    return clubs.find((c) => c.id === id);
  },
};
