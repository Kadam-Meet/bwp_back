// Create reactions collection for post interactions (idempotent)
module.exports.up = async function up(db) {
  const validator = {
    $jsonSchema: {
      bsonType: 'object',
      required: ['postId', 'userId', 'reactionType'],
      properties: {
        postId: { bsonType: 'objectId' },
        userId: { bsonType: 'objectId' },
        reactionType: { 
          bsonType: 'string',
          enum: ['tea', 'spicy', 'cap', 'hearts']
        },
        createdAt: { bsonType: ['date', 'null'] }
      },
    },
  };

  const exists = await db.listCollections({ name: 'reactions' }).toArray();
  if (exists.length === 0) {
    try {
      await db.createCollection('reactions', { validator });
    } catch (err) {
      if (!(err && (err.code === 48 || err.codeName === 'NamespaceExists'))) throw err;
    }
  } else {
    try {
      await db.command({ collMod: 'reactions', validator });
    } catch (_) {}
  }

  // Create indexes for better performance
  try {
    await db.collection('reactions').createIndex({ postId: 1, userId: 1, reactionType: 1 }, { unique: true, name: 'uniq_user_post_reaction' });
  } catch (_) {}

  try {
    await db.collection('reactions').createIndex({ postId: 1, reactionType: 1 }, { name: 'post_reaction_type' });
  } catch (_) {}

  try {
    await db.collection('reactions').createIndex({ userId: 1 }, { name: 'user_reactions' });
  } catch (_) {}
};

module.exports.down = async function down(db) {
  await db.collection('reactions').drop().catch(() => {});
};
