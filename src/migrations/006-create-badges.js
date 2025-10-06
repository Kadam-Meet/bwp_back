// Create badges collection for user achievements (idempotent)
module.exports.up = async function up(db) {
  const validator = {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'description', 'icon', 'rarity'],
      properties: {
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        icon: { bsonType: 'string' },
        rarity: { 
          bsonType: 'string',
          enum: ['common', 'rare', 'legendary']
        },
        requirements: {
          bsonType: 'object',
          properties: {
            postsRequired: { bsonType: 'number' },
            reactionsRequired: { bsonType: 'number' },
            daysActive: { bsonType: 'number' },
            category: { bsonType: 'string' }
          }
        },
        isActive: { bsonType: 'bool' },
        createdAt: { bsonType: ['date', 'null'] }
      },
    },
  };

  const exists = await db.listCollections({ name: 'badges' }).toArray();
  if (exists.length === 0) {
    try {
      await db.createCollection('badges', { validator });
    } catch (err) {
      if (!(err && (err.code === 48 || err.codeName === 'NamespaceExists'))) throw err;
    }
  } else {
    try {
      await db.command({ collMod: 'badges', validator });
    } catch (_) {}
  }

  // Create indexes for better performance
  try {
    await db.collection('badges').createIndex({ name: 1 }, { unique: true, name: 'uniq_badge_name' });
  } catch (_) {}

  try {
    await db.collection('badges').createIndex({ rarity: 1 }, { name: 'badge_rarity' });
  } catch (_) {}

  try {
    await db.collection('badges').createIndex({ isActive: 1 }, { name: 'active_badges' });
  } catch (_) {}
};

module.exports.down = async function down(db) {
  await db.collection('badges').drop().catch(() => {});
};
