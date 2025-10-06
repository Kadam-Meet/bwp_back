// Create room_members collection for user-room relationships (idempotent)
module.exports.up = async function up(db) {
  const validator = {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'roomId'],
      properties: {
        userId: { bsonType: 'objectId' },
        roomId: { bsonType: 'objectId' },
        joinedAt: { bsonType: ['date', 'null'] },
        isActive: { bsonType: 'bool' }
      },
    },
  };

  const exists = await db.listCollections({ name: 'room_members' }).toArray();
  if (exists.length === 0) {
    try {
      await db.createCollection('room_members', { validator });
    } catch (err) {
      if (!(err && (err.code === 48 || err.codeName === 'NamespaceExists'))) throw err;
    }
  } else {
    try {
      await db.command({ collMod: 'room_members', validator });
    } catch (_) {}
  }

  // Create indexes for better performance
  try {
    await db.collection('room_members').createIndex({ userId: 1, roomId: 1 }, { unique: true, name: 'uniq_user_room' });
  } catch (_) {}

  try {
    await db.collection('room_members').createIndex({ roomId: 1, isActive: 1 }, { name: 'room_active_members' });
  } catch (_) {}

  try {
    await db.collection('room_members').createIndex({ userId: 1, isActive: 1 }, { name: 'user_active_rooms' });
  } catch (_) {}
};

module.exports.down = async function down(db) {
  await db.collection('room_members').drop().catch(() => {});
};
