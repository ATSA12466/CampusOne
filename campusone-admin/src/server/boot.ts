import type { Server } from 'node:http';
import type { Config } from './config.ts';
import { App } from './app.ts';
import type { FetchFn } from './app.ts';
import { Db } from './db.ts';
import { createServer } from './server.ts';
import { bootstrapAdmin, ensureFlags } from './seed.ts';
import type { Issued } from './seed.ts';

export interface Running {
  app: App;
  server: Server;
  issued: Issued[];
  url: string;
  close(): Promise<void>;
}

/** Builds the app, prepares data, and starts listening. Used by main.ts and by tests. */
export async function start(config: Config, opts: { memory?: boolean; fetch?: FetchFn } = {}): Promise<Running> {
  const db = new Db(opts.memory ? ':memory:' : config.dataDir);
  const app = new App(config, db, opts.fetch);
  ensureFlags(app);
  const issued: Issued[] = [];
  const admin = bootstrapAdmin(app);
  if (admin) issued.push(admin);

  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, () => resolve());
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : config.port;
  return {
    app,
    server,
    issued,
    url: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      server.closeAllConnections?.();
      await app.idle();
      db.close();
    },
  };
}
