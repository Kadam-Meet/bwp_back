// Example migration: create users collection with basic schema validation (idempotent)
module.exports.up = async function up(db) {
  const validator = {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { bsonType: 'string' },
        email: { bsonType: 'string' },
        password: { bsonType: 'string' },
        alias: { bsonType: 'string' },
        anonymousId: { bsonType: 'string' },
        totalPosts: { bsonType: 'number' },
        totalReactions: { bsonType: 'number' },
        streak: { bsonType: 'number' },
        isActive: { bsonType: 'bool' },
        lastActiveAt: { bsonType: ['date', 'null'] },
        createdAt: { bsonType: ['date', 'null'] },
        updatedAt: { bsonType: ['date', 'null'] }
      },
    },
  };

  const exists = await db.listCollections({ name: 'users' }).toArray();
  if (exists.length === 0) {
    try {
      await db.createCollection('users', { validator });
    } catch (err) {
      // Ignore if already exists (race or prior manual creation)
      if (!(err && (err.code === 48 || err.codeName === 'NamespaceExists'))) throw err;
    }
  } else {
    // Ensure validator is applied if collection already exists
    try {
      await db.command({ collMod: 'users', validator });
    } catch (_) {
      // Some MongoDB versions may not support collMod with validator; ignore
    }
  }

  // Ensure unique index on email exists
  try {
    await db.collection('users').createIndex({ email: 1 }, { unique: true, name: 'uniq_email' });
  } catch (_) {
    // Ignore if it already exists or conflicts
  }

  try {
    await db.collection('users').createIndex({ anonymousId: 1 }, { unique: true, name: 'uniq_anonymous_id' });
  } catch (_) {}

  try {
    await db.collection('users').createIndex({ isActive: 1, lastActiveAt: -1 }, { name: 'active_users' });
  } catch (_) {}
};

module.exports.down = async function down(db) {
  await db.collection('users').drop().catch(() => {});
};


