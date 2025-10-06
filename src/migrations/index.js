// Lightweight migration runner with a migrations collection to track applied files
const path = require('path');
const fs = require('fs');

async function loadMigrationFiles() {
  const dir = path.join(__dirname);
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js') && f !== 'index.js')
    .sort();
  return files.map((filename) => ({
    id: filename,
    path: path.join(dir, filename),
  }));
}

async function getAppliedMigrations(db) {
  const collection = db.collection('migrations');
  const docs = await collection.find({}).sort({ id: 1 }).toArray();
  return new Set(docs.map((d) => d.id));
}

async function markApplied(db, id) {
  const collection = db.collection('migrations');
  await collection.updateOne({ id }, { $set: { id, appliedAt: new Date() } }, { upsert: true });
}

module.exports = async function runMigrations(mongooseConnection) {
  console.log(`\n🔄 ===== MIGRATIONS STARTING =====`);
  console.log(`🔄 [TIMESTAMP] ${new Date().toISOString()}`);
  
  const db = mongooseConnection.getClient().db();
  console.log(`🔄 [DATABASE] ${db.databaseName}`);
  
  const migrationFiles = await loadMigrationFiles();
  console.log(`🔄 [FOUND] ${migrationFiles.length} migration files`);
  migrationFiles.forEach((m, index) => {
    console.log(`🔄 [${index + 1}] ${m.id}`);
  });
  
  const applied = await getAppliedMigrations(db);
  console.log(`🔄 [APPLIED] ${applied.size} migrations already applied`);
  applied.forEach(id => console.log(`🔄 [APPLIED] ${id}`));
  
  let appliedCount = 0;
  let skippedCount = 0;

  for (const m of migrationFiles) {
    if (applied.has(m.id)) {
      console.log(`⏭️ [SKIP] ${m.id} - already applied`);
      skippedCount++;
      continue;
    }
    
    console.log(`\n🔄 ===== APPLYING MIGRATION =====`);
    console.log(`🔄 [MIGRATION] ${m.id}`);
    console.log(`🔄 [PATH] ${m.path}`);
    console.log(`🔄 ================================`);
    
    try {
      // Each migration exports up(db) and down(db)
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const mod = require(m.path);
      if (typeof mod.up !== 'function') {
        console.warn(`⚠️ [WARN] Migration ${m.id} has no up() function, skipping.`);
        await markApplied(db, m.id);
        skippedCount++;
        continue;
      }
      
      console.log(`🔄 [EXECUTING] ${m.id} up() function...`);
      await mod.up(db);
      await markApplied(db, m.id);
      console.log(`✅ [SUCCESS] Applied migration: ${m.id}`);
      appliedCount++;
    } catch (error) {
      console.log(`❌ [ERROR] Failed to apply migration ${m.id}:`, error.message);
      console.log(`❌ [ERROR] Full error:`, error);
      throw error;
    }
  }
  
  console.log(`\n✅ ===== MIGRATIONS COMPLETE =====`);
  console.log(`✅ [APPLIED] ${appliedCount} new migrations`);
  console.log(`✅ [SKIPPED] ${skippedCount} existing migrations`);
  console.log(`✅ [TOTAL] ${migrationFiles.length} migration files processed`);
  console.log(`✅ ================================\n`);
};


