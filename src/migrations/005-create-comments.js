// Create comments collection for post replies (idempotent)
module.exports.up = async function up(db) {
  const validator = {
    $jsonSchema: {
      bsonType: 'object',
      required: ['postId', 'authorId', 'content'],
      properties: {
        postId: { bsonType: 'objectId' },
        authorId: { bsonType: 'objectId' },
        content: { bsonType: 'string' },
        parentCommentId: { bsonType: ['objectId', 'null'] }, // For nested replies
        isDeleted: { bsonType: 'bool' },
        createdAt: { bsonType: ['date', 'null'] },
        updatedAt: { bsonType: ['date', 'null'] }
      },
    },
  };

  const exists = await db.listCollections({ name: 'comments' }).toArray();
  if (exists.length === 0) {
    try {
      await db.createCollection('comments', { validator });
    } catch (err) {
      if (!(err && (err.code === 48 || err.codeName === 'NamespaceExists'))) throw err;
    }
  } else {
    try {
      await db.command({ collMod: 'comments', validator });
    } catch (_) {}
  }

  // Create indexes for better performance
  try {
    await db.collection('comments').createIndex({ postId: 1, createdAt: -1 }, { name: 'post_comments_desc' });
  } catch (_) {}

  try {
    await db.collection('comments').createIndex({ authorId: 1 }, { name: 'author_comments' });
  } catch (_) {}

  try {
    await db.collection('comments').createIndex({ parentCommentId: 1 }, { name: 'parent_comment_replies' });
  } catch (_) {}
};

module.exports.down = async function down(db) {
  await db.collection('comments').drop().catch(() => {});
};
