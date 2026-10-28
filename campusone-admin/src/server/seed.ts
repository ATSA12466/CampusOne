import type { App } from './app.ts';
import { now } from './db.ts';
import { hashPassword, randomId, randomPassword } from './crypto.ts';
import { DEFAULT_FLAGS } from './integrations/catalog.ts';

export function ensureFlags(app: App): void {
  for (const f of DEFAULT_FLAGS) {
    app.db.run('INSERT OR IGNORE INTO flags (key, label, description, enabled) VALUES (?, ?, ?, ?)', f.key, f.label, f.description, f.enabled);
  }
}

export interface Issued {
  email: string;
  role: string;
  password: string;
}

/** Creates the first super admin if none exists. Returns the credentials to print once. */
export function bootstrapAdmin(app: App): Issued | null {
  const exists = app.db.get("SELECT 1 FROM users WHERE role = 'super_admin'");
  if (exists) return null;
  const password = app.config.adminPassword || randomPassword();
  app.db.run(
    `INSERT INTO users (id, name, email, password_hash, role, must_change_password, created_at) VALUES (?, ?, ?, ?, 'super_admin', ?, ?)`,
    randomId(), 'Super Admin', app.config.adminEmail, hashPassword(password), app.config.adminPassword ? 0 : 1, now(),
  );
  app.audit('system', `Created first super admin ${app.config.adminEmail}`);
  return { email: app.config.adminEmail, role: 'super_admin', password: app.config.adminPassword ? '(the ADMIN_PASSWORD you set)' : password };
}

/** Sample content for development. Runs once, and only when SEED_DEMO=true. */
export function seedDemo(app: App): Issued[] {
  if (!app.config.seedDemo || app.setting('demo_seeded') === 'true') return [];
  const db = app.db;
  const t = now();
  const issued: Issued[] = [];

  const user = (name: string, email: string, role: string, level: string, programme: string, phone: string, suspended = 0): string => {
    const password = randomPassword();
    const id = randomId();
    db.run(
      'INSERT INTO users (id, name, email, phone, password_hash, role, level, programme, suspended, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      id, name, email, phone, hashPassword(password), role, level, programme, suspended, t,
    );
    issued.push({ email, role, password });
    return id;
  };
  const ama = user('Ama Mensah', 'ama.student@gctu.edu.gh', 'student', 'Level 200', 'BSc. Information Technology', '0240000001');
  user('Kwame Boateng', 'kwame.executive@gctu.edu.gh', 'student', 'Level 300', 'BSc. Accounting', '0240000002');
  user('Efua Danso', 'efua.src@gctu.edu.gh', 'src_admin', 'Level 400', 'BSc. Marketing', '0240000003');
  user('Esi Arthur', 'esi.arthur@gctu.edu.gh', 'student', 'Level 200', 'BSc. Information Technology', '0240000004', 1);

  const listing = (kind: string, title: string, subtitle: string, owner: string, price: string, status: string, reports = 0): void => {
    db.run('INSERT INTO listings (id, kind, title, subtitle, owner, price, status, reports, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', randomId(), kind, title, subtitle, owner, price, status, reports, t);
  };
  listing('hostel', 'Pinnacle Court Hostel', 'Tesano · 2-in-a-room · 4 min walk to campus', 'Mr. Owusu', 'GHS 5,200 / year', 'featured');
  listing('hostel', 'Sunrise Lodge', 'Abeka · 4-in-a-room · Wi-Fi included', 'Sunrise Properties', 'GHS 3,400 / year', 'approved');
  listing('hostel', 'Greenview Residence', 'Kokomlemle · single rooms · new listing', 'Madam Adjei', 'GHS 6,800 / year', 'pending');
  listing('market', 'HP Pavilion laptop, 8GB RAM', 'Used · Level 300 seller', 'Kojo A.', 'GHS 2,900', 'pending', 2);
  listing('market', 'Engineering Mathematics textbook', 'Good condition', 'Abena K.', 'GHS 120', 'approved');
  listing('market', 'Mini fridge', 'Hostel move-out sale', 'Nana Y.', 'GHS 650', 'pending');
  listing('opportunity', 'IT Support Intern', 'Accra · 3 months · paid', 'Zeta Systems', '', 'approved');
  listing('opportunity', 'Campus Brand Ambassador', 'Part-time · commission', 'QuickPay GH', '', 'pending');
  listing('promo', 'Back-to-school data bundle', 'Home banner · 14 days', 'Telco partner', 'GHS 1,500', 'approved');
  listing('promo', 'Campus food delivery launch', 'Sponsored placement · 7 days', 'BiteRun', 'GHS 800', 'pending');

  const slot = (exam: number, course: string, when: string, time: string, venue: string): void => {
    db.run('INSERT INTO slots (id, is_exam, course, when_text, time_text, venue, level) VALUES (?, ?, ?, ?, ?, ?, ?)', randomId(), exam, course, when, time, venue, 'Level 200');
  };
  slot(0, 'BIT 264 · Database Systems', 'Mon', '8:00 – 10:00', 'SCB-FF12');
  slot(0, 'ACF 251 · Financial Accounting', 'Mon', '10:30 – 12:30', 'SCB-SF5');
  slot(1, 'BIT 264 · Database Systems', '17 Nov', '8:00 AM', 'SCB-FF12');
  slot(1, 'ECON 251 · Intermediate Microeconomics', '18 Nov', '11:30 AM', 'CCB-GF3');

  const material = (course: string, title: string, type: string, uploader: string, status: string): void => {
    db.run('INSERT INTO materials (id, course, title, type, uploader, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', randomId(), course, title, type, uploader, status, t);
  };
  material('BIT 264', 'Database Systems past questions 2024', 'Past questions', 'Class rep', 'pending');
  material('STAT 255', 'Chapter 4 lecture slides', 'Slides', 'Mr. Tetteh', 'approved');
  material('MKT 263', 'Marketing summary notes', 'Notes', 'Student upload', 'pending');

  db.run('INSERT INTO class_reps (id, name, course, level, phone) VALUES (?, ?, ?, ?, ?)', randomId(), 'Kofi Asante', 'BSc. IT', 'Level 200', '024 000 0001');
  db.run('INSERT INTO class_reps (id, name, course, level, phone) VALUES (?, ?, ?, ?, ?)', randomId(), 'Adwoa Frimpong', 'BSc. Accounting', 'Level 300', '024 000 0002');

  db.run('INSERT INTO enquiries (id, user_id, student, subject, body, created_at) VALUES (?, ?, ?, ?, ?, ?)', randomId(), ama, 'Ama Mensah', 'Missing result for ACF 251', 'My mid-semester mark is not showing on the portal. Who should I see?', t);
  db.run('INSERT INTO enquiries (id, user_id, student, subject, body, created_at) VALUES (?, ?, ?, ?, ?, ?)', randomId(), '', 'Kojo Annan', 'Lecture hall clash on Thursday', 'MKT 263 and STAT 255 are both scheduled for 2pm in FF17.', t);
  db.run('INSERT INTO enquiries (id, user_id, student, subject, body, resolved, reply, created_at, replied_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)', randomId(), '', 'Abena Kyei', 'Fee payment deadline', 'Is the deadline extended for level 100 students?', 'The Finance Office extended it to 30 November.', t, t);

  const pollId = randomId();
  db.run('INSERT INTO polls (id, question, options_json, open, created_at) VALUES (?, ?, ?, 1, ?)', pollId, 'Which day should the SRC week open?', JSON.stringify(['Monday', 'Wednesday', 'Friday']), t);
  const votes = [42, 71, 18];
  votes.forEach((count, option) => {
    for (let i = 0; i < count; i++) db.run('INSERT INTO poll_votes (poll_id, user_id, option_index) VALUES (?, ?, ?)', pollId, `seed-${option}-${i}`, option);
  });

  db.run(`INSERT INTO approvals (id, is_event, title, requester, created_at) VALUES (?, 1, 'TechX Career Fair', 'ACS Club', ?)`, randomId(), t);
  db.run(`INSERT INTO approvals (id, is_event, title, requester, created_at) VALUES (?, 0, 'Photography Society', 'Nana Y. (Level 200)', ?)`, randomId(), t);
  db.run(`INSERT INTO approvals (id, is_event, title, requester, created_at) VALUES (?, 1, 'Inter-hall Football Cup', 'Sports Committee', ?)`, randomId(), t);

  db.run(
    `INSERT INTO announcements (id, title, body, audience, channels_json, pinned, created_by, created_at) VALUES (?, 'Registration closes Friday', 'All continuing students must complete course registration.', 'All students', '["inApp"]', 1, 'system', ?)`,
    randomId(), t,
  );

  app.setSetting('demo_seeded', 'true');
  app.audit('system', 'Loaded demo content');
  return issued;
}
