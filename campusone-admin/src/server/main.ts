import { loadConfig } from './config.ts';
import { start } from './boot.ts';

const config = loadConfig();
const running = await start(config);

const line = '─'.repeat(64);
console.log(`\nCampusOne admin is running at http://localhost:${config.port}`);
console.log(`Data folder: ${config.dataDir}`);
console.log(`Live sending (e-mail, SMS, push to students): ${config.allowLiveSending ? 'ON' : 'OFF (dry run)'}`);
if (running.issued.length) {
  console.log(`\n${line}\nAccounts created on this first run. These passwords are shown ONCE.\n${line}`);
  for (const a of running.issued) console.log(`${a.role.padEnd(12)} ${a.email.padEnd(34)} ${a.password}`);
  console.log(`${line}\nSigned-in admins are asked to change a generated password.\n`);
}

const shutdown = async (): Promise<void> => {
  console.log('\nShutting down…');
  await running.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
