import { DatabaseSync } from 'node:sqlite';
import type { SQLInputValue } from 'node:sqlite';
import { join } from 'node:path';

export type Role = 'student' | 'src_admin' | 'super_admin';
export const ROLES: Role[] = ['student', 'src_admin', 'super_admin'];

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: Role;
  level: string;
  programme: string;
  suspended: number;
  invited: number;
  must_change_password: number;
  student_email_verified: number;
  created_at: string;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','src_admin','super_admin')),
  level TEXT NOT NULL DEFAULT '',
  programme TEXT NOT NULL DEFAULT '',
  suspended INTEGER NOT NULL DEFAULT 0,
  invited INTEGER NOT NULL DEFAULT 0,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  student_email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0,
  values_json TEXT NOT NULL DEFAULT '{}',
  secrets_enc TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS student_email_verifications (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('hostel','market','opportunity','promo')),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','featured')),
  reports INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS flags (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL,
  channels_json TEXT NOT NULL DEFAULT '["inApp"]',
  pinned INTEGER NOT NULL DEFAULT 0,
  dispatch_json TEXT NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS slots (
  id TEXT PRIMARY KEY,
  is_exam INTEGER NOT NULL,
  course TEXT NOT NULL,
  when_text TEXT NOT NULL,
  time_text TEXT NOT NULL,
  venue TEXT NOT NULL,
  level TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  course TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  uploader TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS class_reps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  course TEXT NOT NULL,
  level TEXT NOT NULL,
  phone TEXT NOT NULL,
  programme TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS uploaded_files (
  id TEXT PRIMARY KEY,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT '',
  student TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  reply TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  replied_at TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS polls (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  options_json TEXT NOT NULL,
  open INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS poll_votes (
  poll_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  option_index INTEGER NOT NULL,
  PRIMARY KEY (poll_id, user_id)
);
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  is_event INTEGER NOT NULL,
  title TEXT NOT NULL,
  requester TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS devices (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_usage (
  month TEXT PRIMARY KEY,
  requests INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS personal_store (
  user_id TEXT NOT NULL,
  collection TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, collection, item_id)
);
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('direct','group','club')),
  title TEXT NOT NULL DEFAULT '',
  club_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  last_read_at TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (conversation_id, user_id)
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS campus_content (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('club','event')),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  date_text TEXT NOT NULL DEFAULT '',
  details_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS club_memberships (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','rejected')),
  note TEXT NOT NULL DEFAULT '',
  requested_at TEXT NOT NULL,
  UNIQUE (club_id, user_id)
);
CREATE TABLE IF NOT EXISTS club_executives (
  club_id TEXT NOT NULL REFERENCES campus_content(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position TEXT NOT NULL DEFAULT 'Club executive',
  assigned_at TEXT NOT NULL,
  PRIMARY KEY (club_id, user_id)
);
CREATE TABLE IF NOT EXISTS class_rep_updates (
  id TEXT PRIMARY KEY,
  rep_id TEXT NOT NULL REFERENCES class_reps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS event_rsvps (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (event_id, user_id)
);
CREATE TABLE IF NOT EXISTS saved_content (
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  item_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, kind, item_id)
);
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  club_id TEXT NOT NULL DEFAULT '',
  club_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','active','ended')),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  require_membership INTEGER NOT NULL DEFAULT 0,
  max_checkins INTEGER NOT NULL DEFAULT 0,
  code TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','excused','removed')),
  method TEXT NOT NULL DEFAULT 'qr',
  checked_in_at TEXT NOT NULL,
  correction_reason TEXT NOT NULL DEFAULT '',
  UNIQUE (session_id, user_id)
);
CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'Campus life',
  photo TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS community_replies (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS community_reactions (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id)
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read_at TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS moderation_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  created_at TEXT NOT NULL
);
`;

export class Db {
  readonly raw: DatabaseSync;

  constructor(dataDir: string | ':memory:') {
    this.raw = new DatabaseSync(dataDir === ':memory:' ? ':memory:' : join(dataDir, 'campusone-admin.sqlite'));
    this.raw.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    this.raw.exec(SCHEMA);
    this.ensureColumn('users', 'student_email_verified', 'INTEGER NOT NULL DEFAULT 0');
    // Move installations that still hold the previous default palette to the
    // current GCTU blue and gold. Preserve any custom colours set by an admin.
    this.raw.exec("UPDATE settings SET value='#25206A' WHERE key='brand_primary_color' AND lower(value)='#003399'");
    this.raw.exec("UPDATE settings SET value='#F4B52A' WHERE key='brand_accent_color' AND lower(value)='#ffcc00'");
    this.ensureColumn('class_reps', 'user_id', "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn('class_reps', 'group_name', "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn('class_reps', 'session', "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn('class_reps', 'programme', "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn('listings', 'image_url', "TEXT NOT NULL DEFAULT ''");
    this.raw.exec("UPDATE class_reps SET programme=course WHERE programme='' AND user_id=''");
    this.raw.exec("CREATE UNIQUE INDEX IF NOT EXISTS class_rep_assignment ON class_reps(user_id, course, group_name, session) WHERE user_id <> ''");
  }

  private ensureColumn(table: string, column: string, definition: string): void {
    const columns = this.raw.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (!columns.some((item) => item.name === column)) this.raw.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }

  all<T>(sql: string, ...params: SQLInputValue[]): T[] {
    return this.raw.prepare(sql).all(...params) as unknown as T[];
  }

  get<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
    return this.raw.prepare(sql).get(...params) as unknown as T | undefined;
  }

  run(sql: string, ...params: SQLInputValue[]): { changes: number } {
    const r = this.raw.prepare(sql).run(...params);
    return { changes: Number(r.changes) };
  }

  tx<T>(fn: () => T): T {
    this.raw.exec('BEGIN');
    try {
      const out = fn();
      this.raw.exec('COMMIT');
      return out;
    } catch (e) {
      this.raw.exec('ROLLBACK');
      throw e;
    }
  }

  close(): void {
    this.raw.close();
  }
}

export const now = (): string => new Date().toISOString();
