// Node-safe seed: creates demo accounts + scoped grants for local development.
// Run with `npm run db:seed`. Idempotent: existing emails are left untouched.
// NEVER run against production data; all seeded passwords are documented here.
import { hashPassword, newId } from "./crypto";
import { store } from "./store";
import type { Grant } from "./permissions";
import type { PlatformRole, ServerUser } from "./types";

export interface SeedAccount {
  email: string;
  name: string;
  password: string;
  roles: PlatformRole[];
  programme: string;
  level: string;
  verifiedStudent: boolean;
}

export const seedAccounts: SeedAccount[] = [
  {
    email: "ama.student@gctu.edu.gh",
    name: "Ama Mensimah",
    password: "CampusOne-Student-01",
    roles: ["student", "verified-student"],
    programme: "BSc Computer Science",
    level: "200",
    verifiedStudent: true,
  },
  {
    email: "kwame.executive@gctu.edu.gh",
    name: "Kwame Owusu",
    password: "CampusOne-Exec-01",
    roles: ["student", "verified-student", "club-president"],
    programme: "BSc Information Technology",
    level: "300",
    verifiedStudent: true,
  },
  {
    email: "efua.src@gctu.edu.gh",
    name: "Efua Asante",
    password: "CampusOne-SRC-01",
    roles: ["student", "verified-student", "src-admin"],
    programme: "BSc Business Administration",
    level: "300",
    verifiedStudent: true,
  },
  {
    email: "yaw.admin@campusone.app",
    name: "Yaw Boateng",
    password: "CampusOne-Super-01",
    roles: ["student", "super-admin"],
    programme: "Platform Administration",
    level: "Staff",
    verifiedStudent: true,
  },
];

export interface SeedResult {
  created: string[];
  skipped: string[];
  grants: number;
}

export async function seedDatabase(): Promise<SeedResult> {
  const created: string[] = [];
  const skipped: string[] = [];
  let grants = 0;
  const now = new Date().toISOString();
  for (const account of seedAccounts) {
    const email = account.email.toLowerCase();
    const existing = store.find<ServerUser>("users", (u) => u.email === email);
    if (existing) {
      skipped.push(email);
      continue;
    }
    const user: ServerUser = {
      id: newId("u"),
      email,
      name: account.name,
      passwordHash: await hashPassword(account.password),
      roles: account.roles,
      programme: account.programme,
      level: account.level,
      status: "active",
      verifiedStudent: account.verifiedStudent,
      createdAt: now,
      updatedAt: now,
    };
    await store.insert("users", user as unknown as Record<string, unknown>);
    created.push(email);
  }
  // Scoped club grants for the executive seed on the Code Collective fixture club.
  const exec = store.find<ServerUser>("users", (u) => u.email === "kwame.executive@gctu.edu.gh");
  if (exec) {
    const clubId = "club-1";
    const wanted: Grant["permission"][] = [
      "club.members.view",
      "club.members.manage",
      "club.events.manage",
      "club.attendance.manage",
      "club.badges.manage",
      "club.resources.manage",
    ];
    for (const permission of wanted) {
      const existing = store.find<Grant>(
        "grants",
        (g) =>
          g.userId === exec.id &&
          g.permission === permission &&
          g.scopeType === "club" &&
          g.scopeId === clubId &&
          !g.revokedAt,
      );
      if (!existing) {
        await store.insert("grants", {
          id: newId("g"),
          userId: exec.id,
          permission,
          scopeType: "club",
          scopeId: clubId,
          grantedBy: null,
          createdAt: now,
          expiresAt: null,
          revokedAt: null,
        });
        grants += 1;
      }
    }
  }
  return { created, skipped, grants };
}
