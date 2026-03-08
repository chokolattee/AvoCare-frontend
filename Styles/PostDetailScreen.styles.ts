import { StyleSheet, Platform } from 'react-native';

// ─── Palette (mirrors Community screen) ──────────────────────────────────────
const C = {
  forest:     '#2d5016',
  sage:       '#3d6b22',
  sageMed:    '#5a8c35',
  sagePale:   '#ddeece',
  sageMid:    '#b8d4a4',
  sageTint:   '#e8f2de',
  inkSoft:    '#2e4420',
  inkFaint:   '#7a9460',
  inkMid:     '#4a6635',
  mist:       '#e2f0d4',
  fog:        '#c8e0b0',
  bg:         '#e8f2de',
  borderSoft: '#d4e9b8',
  borderMid:  '#c8e0b0',
  cardBg:     '#f4faed',
  white:      '#ffffff',

  // Semantic
  red:        '#e74c3c',
  redSoft:    '#fff0ee',
  gray:       '#888888',
  grayLight:  '#f0f0f0',
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: C.sagePale,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.borderMid,
    ...Platform.select({
      ios:     { shadowColor: '#2a4d10', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: C.inkSoft,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: C.mist,
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },

  // ── Post Card ─────────────────────────────────────────────────────────────
  postCard: {
    backgroundColor: C.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: '#2a4d10', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },

  // ── Author Row ────────────────────────────────────────────────────────────
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.sagePale,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.sageMid,
    marginRight: 10,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.inkSoft,
    marginBottom: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorTime: {
    fontSize: 11,
    color: C.inkFaint,
  },
  editedBadge: {
    fontSize: 10,
    color: '#9ab88c',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  categoryBadge: {
    marginLeft: 'auto',
    backgroundColor: C.mist,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.sage,
    letterSpacing: 0.1,
  },

  // ── Post Images ───────────────────────────────────────────────────────────
  imageScrollContainer: {
    marginBottom: 10,
  },
  imageScrollContent: {
    paddingRight: 20,
  },
  postImage: {
    width: 300,
    height: 200,
    borderRadius: 8,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: C.borderSoft,
  } as any,

  // ── Post Body ─────────────────────────────────────────────────────────────
  postContent: {
    fontSize: 13,
    color: C.inkMid,
    lineHeight: 19,
    marginBottom: 10,
  },

  // ── Like Row ──────────────────────────────────────────────────────────────
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0edcd',
  },
  likeText: {
    fontSize: 12,
    color: C.sageMed,
    fontWeight: '600',
    marginLeft: 5,
  },
  likeTextActive: {
    color: C.red,
  },
  disabledIcon: {
    opacity: 0.4,
  },
  disabledText: {
    opacity: 0.4,
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: C.borderSoft,
    marginBottom: 16,
  },

  // ── Comments Section ──────────────────────────────────────────────────────
  commentsHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: C.inkSoft,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  noComments: {
    fontSize: 13,
    color: C.inkFaint,
    textAlign: 'center',
    marginVertical: 16,
  },

  // ── Comment Card ──────────────────────────────────────────────────────────
  commentCard: {
    backgroundColor: C.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: '#2a4d10', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.sagePale,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: C.sageMid,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: C.inkSoft,
    marginRight: 6,
  },
  commentTime: {
    fontSize: 11,
    color: C.inkFaint,
    flex: 1,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 6,
  },
  commentActionButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: C.mist,
  },
  commentBody: {
    fontSize: 13,
    color: C.inkMid,
    lineHeight: 19,
  },

  // ── Reply Badge ───────────────────────────────────────────────────────────
  replyBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  replyBadgeText: {
    fontSize: 11,
    color: C.sage,
    fontStyle: 'italic',
  },

  // ── Comment Action Bar (like / reply) ─────────────────────────────────────
  commentActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0edcd',
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentLikeText: {
    fontSize: 12,
    color: C.sageMed,
    fontWeight: '600',
  },
  commentLikeTextActive: {
    color: C.red,
  },
  commentReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentReplyText: {
    fontSize: 12,
    color: C.sageMed,
    fontWeight: '600',
  },

  // ── Edit Comment ──────────────────────────────────────────────────────────
  editCommentInput: {
    backgroundColor: C.bg,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: C.inkSoft,
    borderWidth: 1,
    borderColor: C.borderMid,
    marginBottom: 8,
    minHeight: 60,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    backgroundColor: C.sage,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveButtonText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
  },
  cancelEditButton: {
    backgroundColor: C.mist,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
  },
  cancelEditButtonText: {
    color: C.inkFaint,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Login Prompt ──────────────────────────────────────────────────────────
  loginPrompt: {
    backgroundColor: C.cardBg,
    marginTop: 16,
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: '#2a4d10', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  loginPromptText: {
    fontSize: 14,
    color: C.inkMid,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 16,
    lineHeight: 20,
  },
  loginPromptButton: {
    backgroundColor: C.sage,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  loginPromptButtonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Comment Input Bar (bottom) ────────────────────────────────────────────
  commentInputContainer: {
    backgroundColor: C.sagePale,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.borderMid,
    alignItems: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#2a4d10', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  commentInputWrapper: {
    maxWidth: 680,
    width: '100%',
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.mist,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.borderSoft,
  },
  replyIndicatorText: {
    fontSize: 12,
    color: C.sage,
    flex: 1,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    color: C.inkSoft,
    borderWidth: 1,
    borderColor: C.borderSoft,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.sage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  commentErrorText: {
    color: C.red,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },
});