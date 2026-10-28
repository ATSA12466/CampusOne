import type { App } from '../app.ts';
import type { Router } from '../http.ts';
import { badRequest, notFound } from '../http.ts';
import { randomId } from '../crypto.ts';
import { now } from '../db.ts';
import { str } from '../validate.ts';

type Post = { id: string; author_id: string; body: string; topic: string; photo: string; status: string; created_at: string };
function notify(app: App, userId: string, kind: string, title: string, body: string): void {
  app.db.run('INSERT INTO notifications (id,user_id,kind,title,body,created_at) VALUES (?,?,?,?,?,?)', randomId(), userId, kind, title, body, now());
}
function postJson(app: App, row: Post, viewer: string): Record<string, unknown> {
  const author = app.db.get<{ name: string }>('SELECT name FROM users WHERE id=?', row.author_id)?.name ?? 'Campus member';
  const likes = app.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM community_reactions WHERE post_id=?', row.id)?.n ?? 0;
  return { id: row.id, author, body: row.body, topic: row.topic, photo: row.photo || null, createdAt: row.created_at, likes, mine: row.author_id === viewer };
}
export function registerCommunityRoutes(r: Router): void {
  r.get('/api/community/posts', 'student', (ctx) => {
    const search = (ctx.url.searchParams.get('search') ?? '').trim().toLowerCase();
    const mine = ctx.url.searchParams.get('mine') === 'true';
    const rows = ctx.app.db.all<Post>(`SELECT * FROM community_posts WHERE status='published'${mine ? ' AND author_id=?' : ' AND author_id<>?'} ORDER BY created_at DESC LIMIT 100`, ctx.user!.id);
    const items = rows.filter((p) => !search || `${p.body} ${p.topic}`.toLowerCase().includes(search)).map((p) => postJson(ctx.app, p, ctx.user!.id));
    return { items };
  });
  r.post('/api/community/posts', 'student', (ctx) => {
    const body = str(ctx.body, 'body', 'Post', { max: 3000 });
    if (body.length < 5) throw badRequest('Post must be at least 5 characters.');
    const topic = str(ctx.body, 'topic', 'Topic', { max: 80, required: false }) || 'Campus life';
    const photo = typeof ctx.body.photo === 'string' ? ctx.body.photo : '';
    if (photo.length > 850_000) throw badRequest('Photo is too large.');
    const id = randomId(); const createdAt = now();
    ctx.app.db.run("INSERT INTO community_posts (id,author_id,body,topic,photo,status,created_at) VALUES (?,?,?,?,?,'published',?)", id, ctx.user!.id, body, topic, photo, createdAt);
    return { item: postJson(ctx.app, ctx.app.db.get<Post>('SELECT * FROM community_posts WHERE id=?', id)!, ctx.user!.id) };
  });
  r.delete('/api/community/posts/:id', 'student', (ctx) => {
    const result = ctx.app.db.run('DELETE FROM community_posts WHERE id=? AND author_id=?', ctx.params.id!, ctx.user!.id);
    if (!result.changes) throw notFound('Post not found.');
  });
  r.get('/api/community/replies', 'student', (ctx) => ({ items: ctx.app.db.all<{ id:string; post_id:string; author_id:string; body:string; created_at:string }>('SELECT r.* FROM community_replies r JOIN community_posts p ON p.id=r.post_id WHERE p.status=\'published\' ORDER BY r.created_at').map((x) => ({ id:x.id, postId:x.post_id, author:ctx.app.db.get<{name:string}>('SELECT name FROM users WHERE id=?',x.author_id)?.name ?? 'Campus member', body:x.body, createdAt:x.created_at })) }));
  r.post('/api/community/posts/:id/replies', 'student', (ctx) => {
    const post = ctx.app.db.get<Post>("SELECT * FROM community_posts WHERE id=? AND status='published'", ctx.params.id!); if (!post) throw notFound('Post not found.');
    const body = str(ctx.body, 'body', 'Reply', { max: 2000 }); if (body.length < 1) throw badRequest('Reply cannot be empty.');
    const id = randomId(); const createdAt = now(); ctx.app.db.run('INSERT INTO community_replies (id,post_id,author_id,body,created_at) VALUES (?,?,?,?,?)', id, post.id, ctx.user!.id, body, createdAt);
    if (post.author_id !== ctx.user!.id) notify(ctx.app, post.author_id, 'community', 'New reply', `${ctx.user!.name} replied to your post.`);
    return { item: { id, postId: post.id, author: ctx.user!.name, body, createdAt } };
  });
  r.get('/api/community/reactions', 'student', (ctx) => ({ items: ctx.app.db.all<{post_id:string}>('SELECT post_id FROM community_reactions WHERE user_id=?', ctx.user!.id).map((x) => ({ postId:x.post_id })) }));
  r.put('/api/community/posts/:id/reaction', 'student', (ctx) => {
    const post = ctx.app.db.get<Post>("SELECT * FROM community_posts WHERE id=? AND status='published'", ctx.params.id!); if (!post) throw notFound('Post not found.');
    if (ctx.body.reacted === true) ctx.app.db.run('INSERT OR IGNORE INTO community_reactions (post_id,user_id,created_at) VALUES (?,?,?)', post.id, ctx.user!.id, now());
    else ctx.app.db.run('DELETE FROM community_reactions WHERE post_id=? AND user_id=?', post.id, ctx.user!.id);
    return { reacted: ctx.body.reacted === true };
  });
  r.post('/api/reports', 'student', (ctx) => {
    const targetType = str(ctx.body, 'targetType', 'Target type', { max: 30 }); const targetId = str(ctx.body, 'targetId', 'Target', { max: 160 });
    const reason = str(ctx.body, 'reason', 'Reason', { max: 120 }); const detail = str(ctx.body, 'detail', 'Details', { max: 2000, required: false });
    const id = randomId(); ctx.app.db.run('INSERT INTO moderation_reports (id,reporter_id,target_type,target_id,reason,detail,created_at) VALUES (?,?,?,?,?,?,?)', id, ctx.user!.id, targetType, targetId, reason, detail, now()); return { id };
  });
  r.get('/api/admin/reports', ['super_admin','src_admin'], (ctx) => ({ items: ctx.app.db.all<Record<string, unknown>>('SELECT r.*,u.name AS reporter FROM moderation_reports r LEFT JOIN users u ON u.id=r.reporter_id ORDER BY r.created_at DESC') }));
  r.patch('/api/admin/reports/:id', ['super_admin','src_admin'], (ctx) => {
    const status = ctx.body.status; if (!['reviewed','dismissed'].includes(String(status))) throw badRequest('Invalid report status.');
    const report = ctx.app.db.get<{target_type:string;target_id:string}>('SELECT target_type,target_id FROM moderation_reports WHERE id=?',ctx.params.id!); if (!report) throw notFound('Report not found.');
    ctx.app.db.run('UPDATE moderation_reports SET status=? WHERE id=?', status as string, ctx.params.id!);
    if (status === 'reviewed' && ctx.body.hide === true && report.target_type === 'post') ctx.app.db.run("UPDATE community_posts SET status='hidden' WHERE id=?", report.target_id);
  });
  r.get('/api/notifications', 'student', (ctx) => {
    const items = ctx.app.db.all<{id:string;kind:string;title:string;body:string;created_at:string;read_at:string}>('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100',ctx.user!.id).map((n) => ({ id:n.id,kind:n.kind,title:n.title,body:n.body,createdAt:n.created_at,readAt:n.read_at }));
    return { items, unread:items.filter((x) => !x.readAt).length };
  });
  r.patch('/api/notifications', 'student', (ctx) => {
    const ids = ctx.body.ids; if (ids === 'all') ctx.app.db.run("UPDATE notifications SET read_at=? WHERE user_id=? AND read_at=''",now(),ctx.user!.id);
    else if (Array.isArray(ids) && ids.every((x) => typeof x === 'string')) for (const id of ids) ctx.app.db.run("UPDATE notifications SET read_at=? WHERE id=? AND user_id=? AND read_at=''",now(),id,ctx.user!.id);
    else throw badRequest('Provide notification ids or ids=all.');
  });
  r.get('/api/saves', 'student', (ctx) => {
    const kind = ctx.url.searchParams.get('kind');
    return { items: ctx.app.db.all<{kind:string;item_id:string;created_at:string}>(`SELECT kind,item_id,created_at FROM saved_content WHERE user_id=?${kind ? ' AND kind=?' : ''} ORDER BY created_at DESC`, ...(kind ? [ctx.user!.id, kind] : [ctx.user!.id])).map((x) => ({ kind:x.kind,entityId:x.item_id,createdAt:x.created_at })) };
  });
  r.put('/api/saves', 'student', (ctx) => {
    const kind = str(ctx.body,'kind','Kind',{max:50}); const entityId = str(ctx.body,'entityId','Item',{max:200});
    if (typeof ctx.body.saved !== 'boolean') throw badRequest('Saved must be true or false.');
    if (ctx.body.saved) ctx.app.db.run('INSERT OR IGNORE INTO saved_content (user_id,kind,item_id,created_at) VALUES (?,?,?,?)',ctx.user!.id,kind,entityId,now()); else ctx.app.db.run('DELETE FROM saved_content WHERE user_id=? AND kind=? AND item_id=?',ctx.user!.id,kind,entityId);
    return { saved:ctx.body.saved };
  });
}
