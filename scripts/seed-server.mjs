import "./foundation/load-typescript.mjs";

const { seedDatabase, seedAccounts } = await import("../src/server/seed.ts");
const result = await seedDatabase();
console.log(`Seed store: ${process.env.CAMPUSONE_DATA_DIR ?? ".data"}/campusone.json`);
console.log(`Created: ${result.created.join(", ") || "(none)"}`);
console.log(`Skipped (already exist): ${result.skipped.join(", ") || "(none)"}`);
console.log(`Club grants added: ${result.grants}`);
console.log("\nSeed accounts (local development only):");
for (const account of seedAccounts)
  console.log(`- ${account.email} / ${account.password} [${account.roles.join(", ")}]`);
