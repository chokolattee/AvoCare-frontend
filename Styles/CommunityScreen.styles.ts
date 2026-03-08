import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({

  // ─── Layout ────────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#e8f2de',
  },

  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#ddeece',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#c8e0b0',
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2e4420',
    letterSpacing: -0.3,
  },

  // ─── Tabs ──────────────────────────────────────────────────────────────────
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ddeece',
    borderBottomWidth: 1,
    borderBottomColor: '#c8e0b0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3d6b22',
    backgroundColor: '#f0f7e8',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ab88c',
    letterSpacing: 0.1,
  },
  tabTextActive: {
    color: '#3d6b22',
  },
  tabTextArchived: {
    color: '#c07c2a',
  },

  // ─── Main Content ──────────────────────────────────────────────────────────
  mainContent: {
    flex: 1,
    backgroundColor: '#e8f2de',
  },
  centerColumn: {
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },

  // ─── Search ────────────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2f0d4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2e4420',
    padding: 0,
    margin: 0,
  },

  // ─── Categories ────────────────────────────────────────────────────────────
  categoriesRow: {
    marginBottom: 14,
    flexGrow: 0,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0f7e8',
    marginRight: 7,
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
  },
  categoryButtonActive: {
    backgroundColor: '#3d6b22',
    borderColor: '#3d6b22',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a8c35',
    marginLeft: 4,
    letterSpacing: 0.1,
  },
  categoryTextActive: { color: '#fff' },

  // ─── Create Post Toggle ────────────────────────────────────────────────────
  createPostToggle: {
    backgroundColor: '#f0f7e8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
  },
  createPostToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostPlaceholder: {
    fontSize: 14,
    color: '#3d6b22',
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.1,
  },

  // ─── Create Post Form ──────────────────────────────────────────────────────
  createPostForm: {
    backgroundColor: '#f4faed',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#d4e9b8',
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  createPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0edcd',
  },
  createPostHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7aad4e',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  postTitleInput: {
    backgroundColor: '#e8f2de',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#2e4420',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#c8e0b0',
  },
  postCategoryRow: {
    marginBottom: 8,
    flexGrow: 0,
  },
  postCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#e8f2de',
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
    marginRight: 6,
  },
  postCategoryChipActive: {
    backgroundColor: '#3d6b22',
    borderColor: '#3d6b22',
  },
  postCategoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5a8c35',
    marginLeft: 4,
  },
  postCategoryChipTextActive: { color: '#fff' },
  postContentInput: {
    backgroundColor: '#e8f2de',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#2e4420',
    minHeight: 80,
    lineHeight: 19,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#c8e0b0',
  },
  postErrorText: {
    color: '#b83232',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 6,
    marginLeft: 2,
  },

  // ─── Image Previews ────────────────────────────────────────────────────────
  imagePreviewsContainer: {
    marginBottom: 10,
    flexGrow: 0,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  imagePreviewSmall: {
    width: 90,
    height: 90,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c8e0b0',
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 11,
  },

  // ─── Post Actions Row ──────────────────────────────────────────────────────
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#e2f0d4',
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5a8c35',
  },
  postSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3d6b22',
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  postSubmitButtonDisabled: { opacity: 0.55 },
  postSubmitText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ─── Posts ─────────────────────────────────────────────────────────────────
  postsContainer: { marginTop: 4 },

  postCard: {
    backgroundColor: '#f4faed',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d4e9b8',
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },

  // ─── Post Header ───────────────────────────────────────────────────────────
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ddeece',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#b8d4a4',
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  userInfo: { marginLeft: 10, flex: 1 },
  username: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2e4420',
    marginBottom: 1,
  },
  timeContainer: { flexDirection: 'row', alignItems: 'center' },
  timeAgo: { fontSize: 11, color: '#7a9460' },
  editedBadge: {
    fontSize: 10,
    color: '#9ab88c',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  postActionsIcons: { flexDirection: 'row', gap: 6 },
  iconButton: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: '#e8f2de',
  },

  // ─── Post Content ──────────────────────────────────────────────────────────
  postContent: { marginBottom: 10 },
  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2e4420',
    marginBottom: 5,
    lineHeight: 20,
  },

  // ─── Post Images ───────────────────────────────────────────────────────────
  imagesContainer: {
    marginBottom: 8,
    flexGrow: 0,
  },
  postCardImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4e9b8',
  },
  postCardImageMultiple: {
    width: 200,
    marginRight: 8,
  },

  // ─── Post Text & Footer ────────────────────────────────────────────────────
  postText: {
    fontSize: 13,
    color: '#4a6635',
    lineHeight: 19,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0edcd',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
    paddingVertical: 2,
  },
  actionText: {
    fontSize: 12,
    color: '#5a8c35',
    fontWeight: '600',
    marginLeft: 5,
  },
  disabledIcon: { opacity: 0.4 },
  disabledText: { opacity: 0.4 },

  // ─── Empty / Loading ───────────────────────────────────────────────────────
  emptyText: {
    textAlign: 'center',
    color: '#9ab88c',
    marginTop: 36,
    fontSize: 14,
    fontWeight: '500',
  },

  // ─── Unarchive ─────────────────────────────────────────────────────────────
  unarchiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3d6b22',
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: -6,
    marginBottom: 10,
    gap: 6,
  },
  unarchiveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ─── Login Prompt ──────────────────────────────────────────────────────────
  loginPrompt: {
    backgroundColor: '#f4faed',
    marginTop: 20,
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4e9b8',
  },
  loginPromptText: {
    fontSize: 14,
    color: '#4a6635',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 16,
    lineHeight: 20,
  },
  loginPromptButton: {
    backgroundColor: '#3d6b22',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  loginPromptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // ─── Chatbot FAB ───────────────────────────────────────────────────────────
  chatbotButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3d6b22',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 5 },
    }),
  },
  chatbotBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ddeece',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3d6b22',
  },

  // ─── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 50, 20, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#f4faed',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#c8e0b0',
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
    }),
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2e4420',
    marginTop: 10,
    letterSpacing: -0.2,
  },
  modalMessage: {
    fontSize: 15,
    color: '#4a6635',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  modalWarning: {
    fontSize: 13,
    color: '#c07c2a',
    textAlign: 'center',
    marginBottom: 22,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e8f2de',
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3d6b22',
  },
  archiveButton: {
    backgroundColor: '#c07c2a',
  },
  archiveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});