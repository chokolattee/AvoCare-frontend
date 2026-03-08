import { pushNotification } from '../Components/Notifications';

/**
 * Send a notification when someone likes a post.
 * @param postAuthorId  - ID of the user who owns the post (receives the notification)
 * @param currentUserId - ID of the user performing the action
 */
export async function notifyPostLike(
  postAuthorId: string,
  currentUserId: string,
  currentUsername: string,
  postId: string,
  postTitle: string
): Promise<void> {
  if (postAuthorId === currentUserId) return; // Don't notify yourself

  await pushNotification({
    type: 'like',
    userId: postAuthorId, // ← who receives this notification
    title: 'New Like on Your Post ❤️',
    body: `${currentUsername} liked your post: "${postTitle.substring(0, 40)}${postTitle.length > 40 ? '...' : ''}"`,
    navigateTo: 'PostDetail',
    navigateParams: { postId },
  });
}

/**
 * Send a notification when someone comments on a post.
 * @param postAuthorId  - ID of the user who owns the post (receives the notification)
 * @param currentUserId - ID of the user performing the action
 */
export async function notifyPostComment(
  postAuthorId: string,
  currentUserId: string,
  currentUsername: string,
  postId: string,
  commentText: string
): Promise<void> {
  if (postAuthorId === currentUserId) return; // Don't notify yourself

  await pushNotification({
    type: 'comment',
    userId: postAuthorId, // ← who receives this notification
    title: 'New Comment on Your Post 💬',
    body: `${currentUsername} commented: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
    navigateTo: 'PostDetail',
    navigateParams: { postId },
  });
}

/**
 * Send a notification when someone replies to a comment.
 * @param commentAuthorId - ID of the user who owns the comment (receives the notification)
 * @param currentUserId   - ID of the user performing the action
 */
export async function notifyCommentReply(
  commentAuthorId: string,
  currentUserId: string,
  currentUsername: string,
  postId: string,
  replyText: string
): Promise<void> {
  if (commentAuthorId === currentUserId) return; // Don't notify yourself

  await pushNotification({
    type: 'reply',
    userId: commentAuthorId, // ← who receives this notification
    title: 'New Reply to Your Comment 💭',
    body: `${currentUsername} replied: "${replyText.substring(0, 50)}${replyText.length > 50 ? '...' : ''}"`,
    navigateTo: 'PostDetail',
    navigateParams: { postId },
  });
}

/**
 * Send a notification when someone likes a comment.
 * @param commentAuthorId - ID of the user who owns the comment (receives the notification)
 * @param currentUserId   - ID of the user performing the action
 */
export async function notifyCommentLike(
  commentAuthorId: string,
  currentUserId: string,
  currentUsername: string,
  postId: string,
  commentText: string
): Promise<void> {
  if (commentAuthorId === currentUserId) return; // Don't notify yourself

  await pushNotification({
    type: 'like',
    userId: commentAuthorId, // ← who receives this notification
    title: 'New Like on Your Comment ❤️',
    body: `${currentUsername} liked your comment: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
    navigateTo: 'PostDetail',
    navigateParams: { postId },
  });
}