"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Bookmark, ClubMembership, NotificationItem, StudentRequest, TaskItem } from "@/types";
import { engagementService, communityService, productivityService } from "@/services";

const initialMemberships = structuredClone(engagementService.listMemberships());
const initialNotifications = structuredClone(communityService.listNotifications());
const initialTasks = structuredClone(productivityService.listInitialTasks());
const initialStudentRequests = structuredClone(engagementService.listInitialStudentRequests());

interface AppState {
  tasks: TaskItem[];
  bookmarks: Bookmark[];
  memberships: ClubMembership[];
  registrations: string[];
  notifications: NotificationItem[];
  srcRequests: StudentRequest[];
  addTask: (task: Omit<TaskItem, "id" | "completed">) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  updateTask: (task: TaskItem) => void;
  toggleBookmark: (item: Bookmark) => void;
  requestMembership: (clubId: string, userId: string) => void;
  reviewMembership: (membershipId: string, status: "approved" | "rejected") => void;
  toggleEventRegistration: (eventId: string) => void;
  markNotificationRead: (id: string) => void;
  submitSrcRequest: (payload: Pick<StudentRequest, "title" | "category" | "description">) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: initialTasks,
      bookmarks: [],
      memberships: initialMemberships,
      registrations: [],
      notifications: initialNotifications,
      srcRequests: initialStudentRequests,
      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, { ...task, id: crypto.randomUUID(), completed: false }],
        })),
      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task,
          ),
        })),
      removeTask: (id) => set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) })),
      updateTask: (task) =>
        set((state) => ({ tasks: state.tasks.map((t) => (t.id === task.id ? task : t)) })),
      toggleBookmark: (item) =>
        set((state) => {
          const exists = state.bookmarks.some(
            (bookmark) =>
              bookmark.entityId === item.entityId && bookmark.entityType === item.entityType,
          );
          return {
            bookmarks: exists
              ? state.bookmarks.filter(
                  (bookmark) =>
                    !(
                      bookmark.entityId === item.entityId && bookmark.entityType === item.entityType
                    ),
                )
              : [...state.bookmarks, item],
          };
        }),
      requestMembership: (clubId, userId) => {
        const existing = get().memberships.find(
          (membership) => membership.clubId === clubId && membership.userId === userId,
        );
        if (existing) return;
        set((state) => ({
          memberships: [
            ...state.memberships,
            { id: crypto.randomUUID(), clubId, userId, status: "pending" },
          ],
        }));
      },
      reviewMembership: (membershipId, status) =>
        set((state) => ({
          memberships: state.memberships.map((membership) =>
            membership.id === membershipId ? { ...membership, status } : membership,
          ),
        })),
      toggleEventRegistration: (eventId) =>
        set((state) => ({
          registrations: state.registrations.includes(eventId)
            ? state.registrations.filter((registrationId) => registrationId !== eventId)
            : [...state.registrations, eventId],
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification,
          ),
        })),
      submitSrcRequest: (payload) =>
        set((state) => ({
          srcRequests: [
            {
              id: crypto.randomUUID(),
              title: payload.title,
              category: payload.category,
              description: payload.description,
              status: "submitted",
              createdAt: new Date().toISOString().slice(0, 10),
            },
            ...state.srcRequests,
          ],
        })),
    }),
    { name: "campusone-app" },
  ),
);
