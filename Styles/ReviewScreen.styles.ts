import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FAF0',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#2D5016',
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8DB87A',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Stats Bar ─────────────────────────────────────────────────────────────
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#2D5016',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D5016',
  },
  statLabel: {
    fontSize: 11,
    color: '#6A8A50',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E8F0DF',
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#C5D9B0',
    shadowColor: '#2D5016',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2D5016',
    fontWeight: '500',
  },

  // ── Filter Tabs ───────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C5D9B0',
  },
  filterTabActive: {
    backgroundColor: '#2D5016',
    borderColor: '#2D5016',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A8A50',
  },
  filterTabTextActive: {
    color: '#fff',
  },

  // ── Loading / Empty ───────────────────────────────────────────────────────
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6A8A50',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D5016',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6A8A50',
    textAlign: 'center',
  },

  // ── Table ─────────────────────────────────────────────────────────────────
  tableWrapper: {
    flex: 1,
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C5D9B0',
    backgroundColor: '#fff',
    shadowColor: '#2D5016',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  tableScroll: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
  },

  // ── Table Header Row ──────────────────────────────────────────────────────
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#2D5016',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8DB87A',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // ── Table Data Row ────────────────────────────────────────────────────────
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0DF',
    backgroundColor: '#fff',
  },
  tableRowArchived: {
    backgroundColor: '#FEFAF2',
  },
  tableRowEven: {
    backgroundColor: '#F9FCF6',
  },
  tableCell: {
    fontSize: 13,
    color: '#2D5016',
    textAlign: 'center',
  },

  // ── Column widths (flex-based, fills full width) ──────────────────────────
  colUser:    { flex: 1.4, paddingHorizontal: 4 },
  colProduct: { flex: 1.4, paddingHorizontal: 4 },
  colRating:  { flex: 1, paddingHorizontal: 4 },
  colComment: { flex: 1.8, paddingHorizontal: 4 },
  colStatus:  { flex: 1, paddingHorizontal: 4 },
  colDate:    { flex: 1.1, paddingHorizontal: 4 },
  colActions: { flex: 0.9, paddingHorizontal: 4 },

  // ── User cell ─────────────────────────────────────────────────────────────
  userCellInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  tableAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4A7C2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableAvatarInitials: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  tableUserName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D5016',
    flexShrink: 1,
  },

  // ── Product cell ──────────────────────────────────────────────────────────
  productCellInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableProductThumb: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  tableProductThumbPlaceholder: {
    backgroundColor: '#C5D9B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableProductName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D5016',
    flexShrink: 1,
  },

  // ── Rating cell ───────────────────────────────────────────────────────────
  ratingCellInner: {
    alignItems: 'center',
    gap: 2,
  },
  ratingNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C8A84B',
  },

  // ── Action buttons ────────────────────────────────────────────────────────
  actionsCellInner: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableDetailBtn: {
    padding: 6,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#4A7C2F',
  },
  tableArchiveBtn: {
    padding: 6,
    borderRadius: 7,
    backgroundColor: '#C8A84B',
  },
  tableRestoreBtn: {
    padding: 6,
    borderRadius: 7,
    backgroundColor: '#4A7C2F',
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    alignSelf: 'center',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45,80,22,0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C5D9B0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0DF',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D5016',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5FAF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSection: {
    marginTop: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6A8A50',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  modalProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FAF0',
    borderRadius: 12,
    padding: 12,
  },
  modalProductImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  modalProductImagePlaceholder: {
    backgroundColor: '#C5D9B0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalProductName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D5016',
  },
  modalProductPrice: {
    fontSize: 13,
    color: '#4A7C2F',
    fontWeight: '600',
    marginTop: 3,
  },
  modalUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  modalAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A7C2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarInitials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D5016',
  },
  modalUserEmail: {
    fontSize: 13,
    color: '#6A8A50',
    marginTop: 2,
  },
  modalRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalRatingNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#C8A84B',
  },
  modalCommentBox: {
    backgroundColor: '#F5FAF0',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#4A7C2F',
  },
  modalCommentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 21,
  },
  modalReviewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  modalMetaBox: {
    backgroundColor: '#F5FAF0',
    borderRadius: 12,
    padding: 14,
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalMetaKey: {
    fontSize: 13,
    color: '#6A8A50',
    fontWeight: '500',
  },
  modalMetaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D5016',
  },
  archiveBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C8A84B',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  unarchiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A7C2F',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── legacy card styles (kept for modal reuse) ─────────────────────────────
  card: { display: 'none' } as any,
  cardArchived: {} as any,
  archivedStripe: {} as any,
  cardTopRow: {} as any,
  cardAvatarWrap: {} as any,
  cardAvatar: {} as any,
  cardAvatarPlaceholder: {} as any,
  cardAvatarInitials: {} as any,
  cardUserName: {} as any,
  cardDate: {} as any,
  cardProductRow: {} as any,
  cardProductThumb: {} as any,
  cardProductThumbPlaceholder: {} as any,
  cardProductName: {} as any,
  cardComment: {} as any,
  cardImagesRow: {} as any,
  cardImageThumb: {} as any,
  cardImageMore: {} as any,
  cardImageMoreText: {} as any,
  cardActions: {} as any,
  cardDetailBtn: {} as any,
  cardDetailBtnText: {} as any,
  cardActionBtn: {} as any,
  cardArchiveBtn: {} as any,
  cardRestoreBtn: {} as any,
  cardActionBtnText: {} as any,
});