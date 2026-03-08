import { Platform, StyleSheet } from 'react-native';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  forest:     '#2d5016',
  sage:       '#3d6b22',
  sageMed:    '#5a8c35',
  sagePale:   '#d4ecb8',
  sageMid:    '#b0d890',
  sageTint:   '#e4f5d0',
  inkSoft:    '#2e4420',
  inkFaint:   '#6a8450',
  mist:       '#dff0cc',
  fog:        '#cce8b0',
  bg:         '#cce8a8',
  borderSoft: '#cce0a8',
  borderMid:  '#aed090',
  cardBg:     '#f0f9e4',
  white:      '#ffffff',
};

export const styles = StyleSheet.create({

  // ── Container ─────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: C.forest,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: C.borderMid,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  headerLeft: {
    flex: 1,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: C.sageMid,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: C.white,
    letterSpacing: -0.6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  csvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  csvBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  // ── Stats Bar ─────────────────────────────────────────────────────────────
  statsBar: {
    flexDirection: 'row',
    backgroundColor: C.cardBg,
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
      android: { elevation: 6 },
      web:     { boxShadow: '0 4px 14px rgba(26,58,5,0.11)' } as any,
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
    color: C.inkSoft,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 9,
    color: C.inkFaint,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: C.borderSoft,
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 2 },
      web:     { boxShadow: '0 2px 8px rgba(26,58,5,0.08)' } as any,
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.inkSoft,
    fontWeight: '500',
    padding: 0,
  },

  // ── Filter Tabs ───────────────────────────────────────────────────────────
  filterScroll: {
    marginTop: 12,
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 44,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterTab: {
    height: 36,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 18,
    backgroundColor: C.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  filterTabActive: {
    backgroundColor: C.forest,
    borderColor: C.forest,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.inkFaint,
    letterSpacing: 0.1,
  },
  filterTabTextActive: {
    color: C.white,
  },

  // ── Loading / Empty ───────────────────────────────────────────────────────
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: C.inkFaint,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.inkSoft,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.inkFaint,
    textAlign: 'center',
  },
  clearSearch: {
    fontSize: 13,
    color: C.sage,
    fontWeight: '700',
    marginTop: 4,
  },

  // ── Table ─────────────────────────────────────────────────────────────────
  tableWrapper: {
    flex: 1,
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: C.borderMid,
    backgroundColor: C.cardBg,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 10 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 12px rgba(26,58,5,0.09)' } as any,
    }),
  },
  tableScroll: {
    flex: 1,
  },

  // ── Table Header Row ──────────────────────────────────────────────────────
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: C.forest,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: '700',
    color: C.sageMid,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  // ── Table Data Rows ───────────────────────────────────────────────────────
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
    backgroundColor: C.cardBg,
  },
  tableRowEven: {
    backgroundColor: C.mist,
  },
  tableCell: {
    fontSize: 13,
    color: C.inkSoft,
    textAlign: 'center',
  },

  // ── Column flex widths ────────────────────────────────────────────────────
  colId:       { flex: 1.4, paddingHorizontal: 4 },
  colCustomer: { flex: 1.4, paddingHorizontal: 4 },
  colItems:    { flex: 0.8, paddingHorizontal: 4 },
  colTotal:    { flex: 1.1, paddingHorizontal: 4 },
  colStatus:   { flex: 1.2, paddingHorizontal: 4 },
  colDate:     { flex: 1.1, paddingHorizontal: 4 },
  colActions:  { flex: 0.8, paddingHorizontal: 4 },

  // ── Order ID cell ─────────────────────────────────────────────────────────
  orderId: {
    fontSize: 12,
    fontWeight: '700',
    color: C.inkSoft,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  orderDate: {
    fontSize: 10,
    color: C.inkFaint,
    marginTop: 2,
  },

  // ── Customer cell ─────────────────────────────────────────────────────────
  userCellInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  tableAvatarInitials: {
    color: C.white,
    fontSize: 11,
    fontWeight: '700',
  },
  tableUserName: {
    fontSize: 12,
    fontWeight: '600',
    color: C.inkSoft,
    flexShrink: 1,
  },

  // ── Status badge ──────────────────────────────────────────────────────────
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    minHeight: 26,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Action buttons in table ───────────────────────────────────────────────
  actionsCellInner: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableViewBtn: {
    padding: 6,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },

  // ── Detail Modal ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,58,5,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: C.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 2,
    borderColor: C.borderMid,
  },
  modalContainerDesktop: {
    borderRadius: 20,
    maxWidth: 560,
    alignSelf: 'center',
    width: '100%',
    marginVertical: 'auto' as any,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderMid,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: C.borderSoft,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: C.inkSoft,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 11,
    color: C.inkFaint,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.mist,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },

  // ── Modal sections ────────────────────────────────────────────────────────
  modalSection: {
    marginTop: 20,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.inkFaint,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // ── Status Banner inside modal ────────────────────────────────────────────
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statusBannerText: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    letterSpacing: -0.2,
  },
  statusBannerSub: {
    fontSize: 11,
    color: C.inkFaint,
  },

  // ── Info card (customer, payment, shipping) ───────────────────────────────
  infoCard: {
    backgroundColor: C.mist,
    borderRadius: 12,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.sageTint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  infoLabel: {
    fontSize: 10,
    color: C.inkFaint,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: C.inkSoft,
    fontWeight: '600',
  },
  infoSubValue: {
    fontSize: 12,
    color: C.inkFaint,
    marginTop: 1,
  },
  infoDivider: {
    height: 1,
    backgroundColor: C.borderSoft,
    marginHorizontal: 14,
  },

  // ── Payment badge ─────────────────────────────────────────────────────────
  payBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  payBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.white,
  },

  // ── Order items ───────────────────────────────────────────────────────────
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: C.borderSoft,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.inkSoft,
  },
  itemMeta: {
    fontSize: 12,
    color: C.inkFaint,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: C.sage,
  },

  // ── Pricing rows ──────────────────────────────────────────────────────────
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  priceLabel: {
    fontSize: 13,
    color: C.inkFaint,
  },
  priceValue: {
    fontSize: 13,
    color: C.inkSoft,
    fontWeight: '500',
  },
  priceDivider: {
    height: 1,
    backgroundColor: C.borderSoft,
    marginVertical: 6,
    marginHorizontal: 14,
  },

  // ── Status picker ─────────────────────────────────────────────────────────
  pickerWrap: {
    borderTopWidth: 1.5,
    borderColor: C.borderSoft,
    overflow: 'hidden',
    backgroundColor: C.mist,
  },
  picker: {
    height: 48,
    color: C.inkSoft,
  },

  // ── Final state banner (Delivered / Cancelled) ────────────────────────────
  finalStateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  finalStateText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },

  // ── Modal action buttons ──────────────────────────────────────────────────
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.mist,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.inkFaint,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.forest,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.2,
  },

  // ── Confirm / Alert popup modal ───────────────────────────────────────────
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,58,5,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  confirmCard: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24 },
      android: { elevation: 12 },
      web:     { boxShadow: '0 8px 32px rgba(26,58,5,0.14)' } as any,
    }),
    alignItems: 'center',
  },
  confirmIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: C.inkSoft,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  confirmMessage: {
    fontSize: 13,
    color: C.inkFaint,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.mist,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  confirmBtnCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.inkFaint,
  },
  confirmBtnAction: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.white,
  },
});