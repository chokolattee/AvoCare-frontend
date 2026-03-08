import { StyleSheet, Platform } from 'react-native';

// ─── Palette (same as AboutScreen, DashboardScreen & AdminNavigator) ──────────
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: C.inkFaint,
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingBottom: 40,
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
  pdfBtn: {
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
  pdfBtnText: {
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
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: C.inkSoft,
    letterSpacing: -0.4,
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
  searchContainer: {
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
    gap: 8,
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterButton: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: C.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  filterButtonActive: {
    backgroundColor: C.forest,
    borderColor: C.forest,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.inkFaint,
    letterSpacing: 0.1,
  },
  filterTextActive: {
    color: C.white,
  },

  // ── Empty State ───────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 15,
    color: C.inkFaint,
    fontWeight: '600',
  },

  // ── Mobile Card View ──────────────────────────────────────────────────────
  usersList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: C.cardBg,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 10px rgba(26,58,5,0.09)' } as any,
    }),
    alignItems: 'center',
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.sage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
  },
  userImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.inkSoft,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: C.inkFaint,
    marginBottom: 6,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: C.inkFaint,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: C.mist,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.borderSoft,
  },
  moreButton: {
    padding: 6,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Desktop Table ─────────────────────────────────────────────────────────
  tableWrapper: {
    marginHorizontal: 16,
    marginTop: 12,
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.forest,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.sageMid,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
    alignItems: 'center',
    backgroundColor: C.cardBg,
  },
  tableRowEven: {
    backgroundColor: C.mist,
  },
  tableCell: {
    fontSize: 13,
    color: C.inkSoft,
    fontWeight: '500',
  },

  // ── Table column widths ────────────────────────────────────────────────────
  colImage: {
    width: 56,
    paddingHorizontal: 4,
  },
  colName: {
    flex: 1.8,
    paddingHorizontal: 4,
  },
  colEmail: {
    flex: 2.2,
    paddingHorizontal: 4,
  },
  colRole: {
    flex: 1,
    paddingHorizontal: 4,
  },
  colStatus: {
    flex: 1,
    paddingHorizontal: 4,
  },
  colActions: {
    width: 60,
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  // ── Table avatar ──────────────────────────────────────────────────────────
  userImageTable: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  userAvatarTable: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.sage,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  userAvatarTextTable: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },

  // ── Table badges ──────────────────────────────────────────────────────────
  roleBadgeTable: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.borderSoft,
  },
  roleBadgeTextTable: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusBadgeTable: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusTextTable: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  editButtonTable: {
    padding: 6,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Edit Modal ────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,58,5,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: C.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 2,
    borderColor: C.borderMid,
  },
  modalContainerDesktop: {
    borderRadius: 20,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    marginVertical: 'auto' as any,
    maxHeight: '85%',
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
  modalBody: {
    paddingTop: 8,
  },

  // ── Modal user info banner ─────────────────────────────────────────────────
  userInfoModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 14,
    backgroundColor: C.mist,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    gap: 12,
  },
  userImageModal: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  userAvatarModal: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.sage,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  userAvatarTextModal: {
    fontSize: 20,
    fontWeight: '700',
    color: C.white,
  },
  userNameModal: {
    fontSize: 15,
    fontWeight: '800',
    color: C.inkSoft,
    marginBottom: 2,
  },
  userEmailModal: {
    fontSize: 13,
    color: C.inkFaint,
  },

  // ── Modal form ────────────────────────────────────────────────────────────
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: C.inkFaint,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  radioGroupVertical: {
    flexDirection: 'column',
    gap: 8,
  },
  radioOptionFull: {
    alignSelf: 'stretch',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: C.mist,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    gap: 8,
  },
  radioOptionSelected: {
    backgroundColor: C.sageTint,
    borderColor: C.sage,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: C.borderMid,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: C.forest,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: C.forest,
  },
  radioLabel: {
    fontSize: 13,
    color: C.inkSoft,
    fontWeight: '600',
    flex: 1,
  },

  // ── Deactivation reason text input ──────────────────────────────────────────────
  reasonInputContainer: {
    marginTop: 10,
    backgroundColor: C.mist,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reasonInput: {
    fontSize: 14,
    color: C.inkSoft,
    fontWeight: '500',
    minHeight: 72,
    textAlignVertical: 'top',
  },

  // ── Modal actions ─────────────────────────────────────────────────────────
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.mist,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.inkFaint,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.forest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.2,
  },
});