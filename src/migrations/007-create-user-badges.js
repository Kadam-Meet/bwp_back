// Create user_badges collection for user achievements (idempotent)
module.exports.up = async function up(db) {
  const validator = {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'badgeId'],
      properties: {
        userId: { bsonType: 'objectId' },
        badgeId: { bsonType: 'objectId' },
        earnedAt: { bsonType: ['date', 'null'] }
      },
    },
  };

  const exists = await db.listCollections({ name: 'user_badges' }).toArray();
  if (exists.length === 0) {
    try {
      await db.createCollection('user_badges', { validator });
    } catch (err) {
      if (!(err && (err.code === 48 || err.codeName === 'NamespaceExists'))) throw err;
    }
  } else {
    try {
      await db.command({ collMod: 'user_badges', validator });
    } catch (_) {}
  }

  // Create indexes for better performance
  try {
    await db.collection('user_badges').createIndex({ userId: 1, badgeId: 1 }, { unique: true, name: 'uniq_user_badge' });
  } catch (_) {}

  try {
    await db.collection('user_badges').createIndex({ userId: 1, earnedAt: -1 }, { name: 'user_badges_earned' });
  } catch (_) {}

  try {
    await db.collection('user_badges').createIndex({ badgeId: 1 }, { name: 'badge_users' });
  } catch (_) {}
};

module.exports.down = async function down(db) {
  await db.collection('user_badges').drop().catch(() => {});
};
