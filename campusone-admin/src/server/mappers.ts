// Database rows -> JSON shapes. One place so the admin app and the mobile API stay consistent.

export interface ListingRow { id: string; kind: string; title: string; subtitle: string; owner: string; price: string; image_url?: string; status: string; reports: number; created_by: string; created_at: string }
export const listingJson = (r: ListingRow) => ({
  id: r.id, kind: r.kind, title: r.title, subtitle: r.subtitle, owner: r.owner, price: r.price,
  imageUrl: r.image_url ?? '', status: r.status, reports: r.reports, createdAt: r.created_at,
});

export interface SlotRow { id: string; is_exam: number; course: string; when_text: string; time_text: string; venue: string; level: string }
export const slotJson = (r: SlotRow) => ({
  id: r.id, isExam: !!r.is_exam, course: r.course, when: r.when_text, time: r.time_text, venue: r.venue, level: r.level,
});

export interface MaterialRow { id: string; course: string; title: string; type: string; uploader: string; url: string; status: string; created_at: string }
export const materialJson = (r: MaterialRow) => ({
  id: r.id, course: r.course, title: r.title, type: r.type, uploader: r.uploader, url: r.url, status: r.status, createdAt: r.created_at,
});

export interface AnnouncementRow { id: string; title: string; body: string; audience: string; channels_json: string; pinned: number; dispatch_json: string; created_by: string; created_at: string }
export const announcementJson = (r: AnnouncementRow) => ({
  id: r.id, title: r.title, body: r.body, audience: r.audience,
  channels: JSON.parse(r.channels_json) as string[], pinned: !!r.pinned,
  dispatch: JSON.parse(r.dispatch_json) as Record<string, unknown>, createdBy: r.created_by, createdAt: r.created_at,
});

export interface RepRow { id: string; user_id?: string; name: string; course: string; level: string; phone: string; programme?: string; group_name?: string; session?: string }
export const repJson = (r: RepRow) => ({ id: r.id, userId: r.user_id ?? '', name: r.name, course: r.course, level: r.level, phone: r.phone, programme: r.programme || '', group: r.group_name ?? '', session: r.session ?? '' });

export interface EnquiryRow { id: string; user_id: string; student: string; subject: string; body: string; resolved: number; reply: string; created_at: string; replied_at: string }
export const enquiryJson = (r: EnquiryRow) => ({
  id: r.id, student: r.student, subject: r.subject, body: r.body, resolved: !!r.resolved, reply: r.reply,
  createdAt: r.created_at, repliedAt: r.replied_at || null,
});

export interface PollRow { id: string; question: string; options_json: string; open: number; created_at: string }
export const pollJson = (r: PollRow, votes: number[], myVote: number | null = null) => ({
  id: r.id, question: r.question, options: JSON.parse(r.options_json) as string[], open: !!r.open,
  votes, total: votes.reduce((a, b) => a + b, 0), myVote, createdAt: r.created_at,
});

export interface ApprovalRow { id: string; is_event: number; title: string; requester: string; status: string; created_at: string }
export const approvalJson = (r: ApprovalRow) => ({
  id: r.id, isEvent: !!r.is_event, title: r.title, requester: r.requester, status: r.status, createdAt: r.created_at,
});
