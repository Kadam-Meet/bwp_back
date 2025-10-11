const Comment = require('../models/Comment');
const Post = require('../models/Post');

// GET /comments/:postId
async function getPostComments(req, res) {
  console.log('🔵 [COMMENT] GET /comments/:postId - Fetching comments for post:', req.params.postId);
  try {
    const postId = req.params.postId;
    
    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'post_not_found' });
    }
    
    // Get all comments for this post (not deleted, not replies)
    const comments = await Comment.find({ 
      postId, 
      isDeleted: false, 
      parentCommentId: null 
    })
    .populate('authorId', 'name alias anonymousId')
    .sort({ createdAt: -1 });
    
    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ 
          parentCommentId: comment._id, 
          isDeleted: false 
        })
        .populate('authorId', 'name alias anonymousId')
        .sort({ createdAt: 1 }); // Replies in chronological order
        
        return {
          id: comment._id,
          content: comment.content,
          author: {
            name: comment.authorId.name,
            alias: comment.authorId.alias,
            anonymousId: comment.authorId.anonymousId
          },
          createdAt: comment.createdAt,
          replies: replies.map(reply => ({
            id: reply._id,
            content: reply.content,
            author: {
              name: reply.authorId.name,
              alias: reply.authorId.alias,
              anonymousId: reply.authorId.anonymousId
            },
            createdAt: reply.createdAt
          }))
        };
      })
    );
    
    console.log('✅ [COMMENT] Found', commentsWithReplies.length, 'comments for post');
    return res.json(commentsWithReplies);
  } catch (err) {
    console.log('❌ [COMMENT] Error fetching comments:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// POST /comments
async function createComment(req, res) {
  console.log('🔵 [COMMENT] POST /comments - Creating new comment');
  console.log('🔵 [COMMENT] Request body:', req.body);
  try {
    const { postId, authorId, content, parentCommentId } = req.body;
    
    // Validate required fields
    if (!postId || !authorId || !content) {
      return res.status(400).json({ error: 'postId_authorId_and_content_required' });
    }
    
    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'post_not_found' });
    }
    
    // If it's a reply, verify parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ error: 'parent_comment_not_found' });
      }
    }
    
    // Create new comment
    const newComment = new Comment({
      postId,
      authorId,
      content: content.trim(),
      parentCommentId: parentCommentId || null
    });
    
    const savedComment = await newComment.save();
    await savedComment.populate('authorId', 'name alias anonymousId');
    
    console.log('✅ [COMMENT] Comment created successfully:', savedComment._id);
    
    return res.status(201).json({
      id: savedComment._id,
      content: savedComment.content,
      author: {
        name: savedComment.authorId.name,
        alias: savedComment.authorId.alias,
        anonymousId: savedComment.authorId.anonymousId
      },
      createdAt: savedComment.createdAt,
      parentCommentId: savedComment.parentCommentId
    });
  } catch (err) {
    console.log('❌ [COMMENT] Error creating comment:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

// DELETE /comments/:commentId
async function deleteComment(req, res) {
  console.log('🔵 [COMMENT] DELETE /comments/:commentId - Deleting comment:', req.params.commentId);
  try {
    const { commentId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'user_id_required' });
    }
    
    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'comment_not_found' });
    }
    
    // Check if user is the author
    if (comment.authorId.toString() !== userId) {
      return res.status(403).json({ error: 'not_authorized' });
    }
    
    // Soft delete the comment
    comment.isDeleted = true;
    await comment.save();
    
    console.log('✅ [COMMENT] Comment deleted successfully:', commentId);
    return res.json({ message: 'comment_deleted' });
  } catch (err) {
    console.log('❌ [COMMENT] Error deleting comment:', err.message);
    return res.status(500).json({ error: 'internal_error' });
  }
}

module.exports = {
  getPostComments,
  createComment,
  deleteComment
};
