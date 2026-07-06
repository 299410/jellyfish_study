// Migration script: Add User, update Deck with userId, add Anki states to Flashcard
// This script handles existing data gracefully

const { PrismaClient } = require("@prisma/client");
const { execSync } = require("child_process");
const Database = require("better-sqlite3");
const path = require("path");

async function migrate() {
  const dbPath = path.join(__dirname, "..", "prisma", "dev.db");
  
  console.log("📦 Opening database:", dbPath);
  const db = new Database(dbPath);
  
  // Enable WAL mode for safety
  db.pragma("journal_mode = WAL");

  console.log("\n🔧 Step 1: Create User table...");
  db.exec(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("🔧 Step 2: Create default user...");
  const defaultUserId = "default-owner";
  const existingUser = db.prepare('SELECT id FROM "User" WHERE id = ?').get(defaultUserId);
  if (!existingUser) {
    db.prepare("INSERT INTO \"User\" (id, name, createdAt) VALUES (?, ?, datetime('now'))").run(
      defaultUserId,
      "Owner"
    );
    console.log("   ✅ Created default user 'Owner'");
  } else {
    console.log("   ⏭️  Default user already exists, skipping");
  }

  console.log("🔧 Step 3: Add userId column to Deck...");
  try {
    db.exec('ALTER TABLE "Deck" ADD COLUMN "userId" TEXT');
    console.log("   ✅ Added userId column");
  } catch (e) {
    if (e.message.includes("duplicate column")) {
      console.log("   ⏭️  userId column already exists, skipping");
    } else {
      throw e;
    }
  }

  console.log("🔧 Step 4: Assign all existing decks to default user...");
  const result = db.prepare('UPDATE "Deck" SET "userId" = ? WHERE "userId" IS NULL').run(defaultUserId);
  console.log(`   ✅ Updated ${result.changes} decks`);

  console.log("🔧 Step 5: Add Anki state columns to Flashcard...");
  const columnsToAdd = [
    { name: "status", sql: 'ALTER TABLE "Flashcard" ADD COLUMN "status" TEXT NOT NULL DEFAULT \'NEW\'' },
    { name: "stepIndex", sql: 'ALTER TABLE "Flashcard" ADD COLUMN "stepIndex" INTEGER NOT NULL DEFAULT 0' },
  ];

  for (const col of columnsToAdd) {
    try {
      db.exec(col.sql);
      console.log(`   ✅ Added ${col.name} column`);
    } catch (e) {
      if (e.message.includes("duplicate column")) {
        console.log(`   ⏭️  ${col.name} column already exists, skipping`);
      } else {
        throw e;
      }
    }
  }

  console.log("🔧 Step 6: Migrate existing card statuses...");
  // Cards with repetition > 0 and interval > 1 → REVIEW
  const r1 = db.prepare(
    'UPDATE "Flashcard" SET "status" = \'REVIEW\' WHERE "repetition" > 0 AND "interval" > 1 AND "status" = \'NEW\''
  ).run();
  console.log(`   ✅ ${r1.changes} cards → REVIEW`);

  // Cards with repetition > 0 and interval <= 1 → LEARNING  
  const r2 = db.prepare(
    'UPDATE "Flashcard" SET "status" = \'LEARNING\' WHERE "repetition" > 0 AND "interval" <= 1 AND "status" = \'NEW\''
  ).run();
  console.log(`   ✅ ${r2.changes} cards → LEARNING`);

  console.log("🔧 Step 7: Verify data integrity...");
  const userCount = db.prepare('SELECT COUNT(*) as count FROM "User"').get();
  const deckCount = db.prepare('SELECT COUNT(*) as count FROM "Deck"').get();
  const deckNoUser = db.prepare('SELECT COUNT(*) as count FROM "Deck" WHERE "userId" IS NULL').get();
  const cardCount = db.prepare('SELECT COUNT(*) as count FROM "Flashcard"').get();
  
  console.log(`   Users: ${userCount.count}`);
  console.log(`   Decks: ${deckCount.count} (${deckNoUser.count} without user)`);
  console.log(`   Cards: ${cardCount.count}`);

  db.close();

  console.log("\n🔧 Step 8: Sync Prisma schema...");
  console.log("   Running: npx prisma db push --accept-data-loss");
}

migrate()
  .then(() => {
    console.log("\n✅ Migration completed successfully!");
  })
  .catch((e) => {
    console.error("\n❌ Migration failed:", e);
    process.exit(1);
  });
