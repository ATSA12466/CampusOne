-- Initial Postgres schema for Phase 1

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invitations (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  sender_id INTEGER NULL REFERENCES users(id),
  token VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  published_at DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  cover TEXT,
  objectives JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS club_memberships (
  id SERIAL PRIMARY KEY,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  venue TEXT,
  date DATE,
  category TEXT,
  seats INTEGER DEFAULT 0,
  registered INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  course TEXT,
  priority TEXT,
  due_date TIMESTAMP WITH TIME ZONE NULL,
  status TEXT DEFAULT 'todo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS timetable_entries (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT,
  course TEXT,
  start_time TEXT,
  end_time TEXT,
  venue TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- seed some demo clubs and events
INSERT INTO clubs (id, name, category, description, cover, objectives) VALUES
('club-1','Code Collective','Technology','Peer coding sessions, hackathons, and product showcases.','/images/placeholders/club-code.svg', '["Build practical projects","Mentor freshers","Host hackathons"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO clubs (id, name, category, description, cover, objectives) VALUES
('club-2','Debate Assembly','Public Speaking','Weekly debate and communication workshops.','/images/placeholders/club-debate.svg', '["Critical thinking","Confident public speaking"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events (id, title, venue, date, category, seats, registered) VALUES
('e1','Innovation Night','Main Auditorium','2026-10-16','Showcase',300,120)
ON CONFLICT (id) DO NOTHING;

INSERT INTO events (id, title, venue, date, category, seats, registered) VALUES
('e2','Data Science Career Talk','Seminar Hall A','2026-10-20','Career',180,86)
ON CONFLICT (id) DO NOTHING;
