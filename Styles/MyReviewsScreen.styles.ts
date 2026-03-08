import { StyleSheet, Platform } from 'react-native';

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7faf4',
    ...(Platform.OS === 'web' ? { height: '100vh' as any, overflow: 'hidden' as any } : {}),
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f5e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 15,
    color: '#3d6b22',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e3a10',
  },
  countBadge: {
    backgroundColor: '#3d6b22',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── States ────────────────────────────────────────────────────────────────
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: {
    color: '#7a9e6a',
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e3a10',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7a9e6a',
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#3d6b22',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    padding: 16,
    gap: 14,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8f5e0',
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardTop: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#f0f7ec',
  },
  productMeta: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    color: '#1e3a10',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  productPrice: {
    color: '#7a9e6a',
    fontSize: 12,
    marginBottom: 6,
  },
  orderPill: {
    backgroundColor: '#f0f9eb',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d0e8c0',
  },
  orderPillLabel: {
    color: '#7a9e6a',
    fontSize: 10,
  },
  orderPillId: {
    color: '#3d6b22',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // ── Rating row ────────────────────────────────────────────────────────────
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    color: '#7a9e6a',
    fontSize: 12,
  },

  // ── Comment ───────────────────────────────────────────────────────────────
  commentText: {
    color: '#2c4f14',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },

  // ── Carousel ──────────────────────────────────────────────────────────────
  carouselContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
    backgroundColor: '#f0f7ec',
  },
  carouselImage: {
    width: '100%',
    height: 200,
  },
  carouselBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselCounter: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  carouselCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Action buttons ────────────────────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#3d6b22',
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  archiveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e65100',
  },
  archiveBtnText: {
    color: '#e65100',
    fontWeight: '700',
    fontSize: 13,
  },
  orderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d0e8c0',
  },
  orderBtnText: {
    color: '#3d6b22',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Modal – Edit ──────────────────────────────────────────────────────────
  modalSafe: {
    flex: 1,
    backgroundColor: '#f7faf4',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f5e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e3a10',
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalProductName: {
    color: '#7a9e6a',
    fontSize: 14,
    marginBottom: 20,
  },
  fieldLabel: {
    color: '#1e3a10',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fafff7',
    borderWidth: 1,
    borderColor: '#d0e8c0',
    borderRadius: 10,
    padding: 14,
    color: '#1e3a10',
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#3d6b22',
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  uploadBtnText: {
    color: '#3d6b22',
    fontWeight: '600',
    fontSize: 14,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewItem: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e8f5e0',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0e8c0',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#7a9e6a',
    fontWeight: '600',
  },
  updateBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3d6b22',
    alignItems: 'center',
  },
  updateBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Modal – Archive ───────────────────────────────────────────────────────
  archiveBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  archiveBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e8f5e0',
  },
  archiveTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e3a10',
    marginBottom: 10,
  },
  archiveMsg: {
    fontSize: 14,
    color: '#7a9e6a',
    marginBottom: 16,
    lineHeight: 20,
  },
  archivePreview: {
    backgroundColor: '#fafff7',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8f5e0',
    marginBottom: 20,
    gap: 6,
  },
  archivePreviewName: {
    color: '#1e3a10',
    fontWeight: '600',
    fontSize: 14,
  },
  archivePreviewComment: {
    color: '#7a9e6a',
    fontSize: 13,
    lineHeight: 19,
  },
  archiveActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmArchiveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#e65100',
    alignItems: 'center',
  },
  confirmArchiveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default s;