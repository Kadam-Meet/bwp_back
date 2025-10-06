// Create posts collection with basic schema validation and indexes (idempotent)
module.exports.up = async function up(db) {
  const validator = {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'content', 'authorId', 'roomId'],
      properties: {
        title: { bsonType: 'string' },
        content: { bsonType: 'string' },
        authorId: { bsonType: 'objectId' },
        roomId: { bsonType: 'objectId' },
        category: { bsonType: 'string' },
        duration: { bsonType: 'string' },
        isVoiceNote: { bsonType: 'bool' },
        isExpired: { bsonType: 'bool' },
        expiresAt: { bsonType: ['date', 'null'] },
        createdAt: { bsonType: ['date', 'null'] },
        updatedAt: { bsonType: ['date', 'null'] }
      },
    },
  };

  const exists = await db.listCollections({ name: 'posts' }).toArray();
  if (exists.length === 0) {
    try {
      await db.createCollection('posts', { validator });
    } catch (err) {
      if (!(err && (err.code === 48 || err.codeName === 'NamespaceExists'))) throw err;
    }
  } else {
    try {
      await db.command({ collMod: 'posts', validator });
    } catch (_) {}
  }

  try {
    await db.collection('posts').createIndex({ createdAt: -1 }, { name: 'createdAt_desc' });
  } catch (_) {}

  try {
    await db.collection('posts').createIndex({ roomId: 1, createdAt: -1 }, { name: 'room_posts_desc' });
  } catch (_) {}

  try {
    await db.collection('posts').createIndex({ authorId: 1 }, { name: 'author_posts' });
  } catch (_) {}

  try {
    await db.collection('posts').createIndex({ isExpired: 1, expiresAt: 1 }, { name: 'expired_posts' });
  } catch (_) {}
};

module.exports.down = async function down(db) {
  await db.collection('posts').drop().catch(() => {});
};


