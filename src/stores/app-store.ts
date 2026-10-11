"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Bookmark, ClubMembership, NotificationItem, StudentRequest, TaskItem } from "@/types";
import { demoAppStateService } from "@/services";

const seed = demoAppStateService.initial();

interface AppState {
  tasks: TaskItem[];
  bookmarks: Bookmark[];
  memberships: ClubMembership[];
  registrations: string[];
  notifications: NotificationItem[];
  srcRequests: StudentRequest[];
  clearAccount: () => void;
  resetDemo: () => void;
  addTask: (task: Omit<TaskItem, "id" | "completed">) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  updateTask: (task: TaskItem) => void;
  toggleBookmark: (item: Bookmark) => void;
  setBookmark: (item: Bookmark, saved: boolean) => void;
  requestMembership: (
    clubId: string,
    userId: string,
    details?: Pick<ClubMembership, "applicantName" | "note" | "requestedAt">,
  ) => void;
  withdrawMembership: (clubId: string, userId: string) => void;
  reviewMembership: (membershipId: string, status: "approved" | "rejected") => void;
  toggleEventRegistration: (eventId: string) => void;
  setEventRegistration: (eventId: string, going: boolean) => void;
  markNotificationRead: (id: string) => void;
  submitSrcRequest: (payload: Pick<StudentRequest, "title" | "category" | "description">) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: seed.tasks,
      bookmarks: [],
      memberships: seed.memberships,
      registrations: [],
      notifications: seed.notifications,
      srcRequests: seed.srcRequests,
      clearAccount: () =>
        set({
          tasks: [],
          bookmarks: [],
          memberships: [],
          registrations: [],
          notifications: [],
          srcRequests: [],
        }),
      resetDemo: () => set({ ...demoAppStateService.initial(), bookmarks: [], registrations: [] }),
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
      setBookmark: (item, saved) =>
        set((state) => {
          const matches = (bookmark: Bookmark) =>
            bookmark.entityId === item.entityId &&
            bookmark.entityType === item.entityType;
          const exists = state.bookmarks.some(matches);
          return {
            bookmarks:
              exists === saved
                ? [...state.bookmarks]
                : saved
                  ? [...state.bookmarks, item]
                  : state.bookmarks.filter((bookmark) => !matches(bookmark)),
          };
        }),
      requestMembership: (clubId, userId, details = {}) => {
        const existing = get().memberships.find(
          (membership) => membership.clubId === clubId && membership.userId === userId,
        );
        if (existing && existing.status !== "rejected") return;
        if (existing) {
          set((state) => ({
            memberships: state.memberships.map((item) =>
              item.id === existing.id ? { ...item, ...details, status: "pending" } : item,
            ),
          }));
          return;
        }
        set((state) => ({
          memberships: [
            ...state.memberships,
            { ...details, id: crypto.randomUUID(), clubId, userId, status: "pending" },
          ],
        }));
      },
      withdrawMembership: (clubId, userId) =>
        set((state) => ({
          memberships: state.memberships.filter(
            (item) => item.clubId !== clubId || item.userId !== userId,
          ),
        })),
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
      setEventRegistration: (eventId, going) =>
        set((state) => ({
          registrations: going
            ? [...new Set([...state.registrations, eventId])]
            : state.registrations.filter((id) => id !== eventId),
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
