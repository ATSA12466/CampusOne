import { randomId } from '../crypto.ts';
import { now } from '../db.ts';
import type { App } from '../app.ts';
import type { Router, Ctx } from '../http.ts';
import { badRequest, notFound } from '../http.ts';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { str, oneOf } from '../validate.ts';

const TYPES: Record<string, string> = {
  '.pdf':'application/pdf', '.ppt':'application/vnd.ms-powerpoint',
  '.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.doc':'application/msword', '.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt':'text/plain; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif', '.avif':'image/avif',
  '.mp4':'video/mp4', '.m4v':'video/x-m4v', '.mov':'video/quicktime', '.webm':'video/webm',
  '.mp3':'audio/mpeg', '.m4a':'audio/mp4', '.wav':'audio/wav',
};
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const fileRoot = (app: App): string => join(app.config.dataDir, 'uploads');

async function saveUpload(ctx: Ctx) {
  const fileName = str(ctx.body, 'fileName', 'File name', { max: 180 });
  const extension = extname(fileName).toLowerCase();
  const mime = TYPES[extension];
  if (!mime) throw badRequest('Unsupported file type. Use an image, video, audio, PDF, Word, PowerPoint or text file.');
  const encoded = str(ctx.body, 'data', 'File data', { max: 34 * 1024 * 1024 });
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) throw badRequest('The uploaded file data is invalid.');
  const bytes = Buffer.from(encoded, 'base64');
  if (!bytes.length || bytes.length > MAX_FILE_BYTES) throw badRequest('Files must be 25 MB or smaller.');
  const id = randomId();
  const storedName = `${id}${extension}`;
  const root = fileRoot(ctx.app);
  await mkdir(root, { recursive: true });
  await writeFile(join(root, storedName), bytes, { flag: 'wx', mode: 0o600 });
  try {
    ctx.app.db.run('INSERT INTO uploaded_files (id,original_name,stored_name,mime_type,size_bytes,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?)', id, fileName, storedName, mime, bytes.length, ctx.user!.id, now());
  } catch (error) {
    const { unlink } = await import('node:fs/promises');
    await unlink(join(root, storedName)).catch(() => undefined);
    throw error;
  }
  return { id, fileName, mimeType: mime, size: bytes.length, url: `/api/files/${id}` };
}

export function registerFileRoutes(r: Router): void {
  // Uploads are staged privately; a public download works only after the asset
  // is attached to approved material, published campus content, or branding.
  r.post('/api/files/upload', ['src_admin','super_admin'], async (ctx) => {
    const file = await saveUpload(ctx);
    ctx.app.audit(ctx.user!.email, `Uploaded ${file.fileName} (${file.size} bytes)`);
    return { file };
  });

  r.post('/api/src/materials/upload', ['src_admin','super_admin'], async (ctx) => {
    const course = str(ctx.body, 'course', 'Course', { max: 80 });
    const title = str(ctx.body, 'title', 'Title', { max: 150 });
    const type = oneOf(ctx.body, 'type', 'Type', ['Slides','Notes','Past questions','Other'] as const);
    const file = await saveUpload(ctx);
    const createdAt = now();
    ctx.app.db.run("INSERT INTO materials (id,course,title,type,uploader,url,status,created_at) VALUES (?,?,?,?,?,?,'approved',?)", file.id, course, title, type, ctx.user!.name, file.url, createdAt);
    ctx.app.audit(ctx.user!.email, `Uploaded ${type} for ${course}: ${title}`);
    return { file };
  });

  r.get('/api/files/:id', 'public', async (ctx) => {
    const url = `/api/files/${ctx.params.id!}`;
    const file = ctx.app.db.get<{ original_name:string; stored_name:string; mime_type:string }>(
      `SELECT f.original_name,f.stored_name,f.mime_type FROM uploaded_files f WHERE f.id=? AND (
        EXISTS (SELECT 1 FROM materials m WHERE m.id=f.id AND m.status='approved') OR
        EXISTS (SELECT 1 FROM settings s WHERE s.value=?) OR
        EXISTS (SELECT 1 FROM campus_content c WHERE c.status='published' AND c.details_json LIKE '%' || ? || '%')
      )`, ctx.params.id!, url, url,
    );
    if (!file) throw notFound('File not found.');
    let data: Buffer;
    try { data = await readFile(join(fileRoot(ctx.app), file.stored_name)); }
    catch { throw notFound('File is no longer available.'); }
    const safeName = file.original_name.replace(/[\r\n"\\]/g, '_');
    ctx.res.writeHead(200, {
      'Content-Type': file.mime_type,
      'Content-Length': data.length,
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    });
    ctx.res.end(data);
  });
}
