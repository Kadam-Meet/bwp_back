// Create rooms collection for topic-based chat rooms (idempotent)
module.exports.up = async function up(db) {
  const validator = {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'description', 'icon', 'gradient'],
      properties: {
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        icon: { bsonType: 'string' },
        gradient: { bsonType: 'string' },
        isTrending: { bsonType: 'bool' },
        memberCount: { bsonType: 'number' },
        recentPostCount: { bsonType: 'number' },
        lastActivity: { bsonType: ['date', 'null'] },
        createdAt: { bsonType: ['date', 'null'] },
        updatedAt: { bsonType: ['date', 'null'] }
      },
    },
  };

  const exists = await db.listCollections({ name: 'rooms' }).toArray();
  if (exists.length === 0) {
    try {
      await db.createCollection('rooms', { validator });
    } catch (err) {
      if (!(err && (err.code === 48 || err.codeName === 'NamespaceExists'))) throw err;
    }
  } else {
    try {
      await db.command({ collMod: 'rooms', validator });
    } catch (_) {}
  }

  // Create indexes for better performance
  try {
    await db.collection('rooms').createIndex({ name: 1 }, { unique: true, name: 'uniq_room_name' });
  } catch (_) {}

  try {
    await db.collection('rooms').createIndex({ isTrending: -1, memberCount: -1 }, { name: 'trending_members' });
  } catch (_) {}

  try {
    await db.collection('rooms').createIndex({ lastActivity: -1 }, { name: 'last_activity_desc' });
  } catch (_) {}
};

module.exports.down = async function down(db) {
  await db.collection('rooms').drop().catch(() => {});
};
